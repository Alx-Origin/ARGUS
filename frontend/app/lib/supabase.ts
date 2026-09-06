import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export type PlayerProfile = {
  id: string;
  name: string;
  avatar: string;
  totalScore: number;
  completedLevels: number;
};

export type LeaderboardEntry = PlayerProfile & {
  rank: number;
};

export type AuthUser = Pick<User, 'id' | 'email'> & { username?: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The app remains playable without a configured project (for local previews),
// while production uses the public anon key and RLS policies from supabase/schema.sql.
export const supabase: SupabaseClient | null = supabaseUrl && supabasePublicKey
  ? createClient(supabaseUrl, supabasePublicKey)
  : null;

export const isSupabaseConfigured = Boolean(supabase);

const AUTH_EMAIL_DOMAIN = 'argus.local';

export function normalizeUsername(value: string): string {
  return value.normalize('NFKC').trim();
}

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function usernameEmail(username: string): string {
  const normalized = normalizeUsername(username).toLowerCase();
  const encoded = [...normalized].map((character) => character.codePointAt(0)!.toString(16)).join('-');
  return `u-${encoded}@${AUTH_EMAIL_DOMAIN}`;
}

function fromAuthUser(user: User): AuthUser {
  return { id: user.id, email: user.email, username: typeof user.user_metadata?.username === 'string' ? user.user_metadata.username : undefined };
}

export async function getAuthUser(): Promise<AuthUser | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return fromAuthUser(data.user);
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!supabase) throw new Error('请先配置 Supabase URL 和 anon key');
  const { data, error } = await supabase.from('player_profiles').select('id').ilike('name', escapeIlike(normalizeUsername(username))).maybeSingle();
  if (error) throw error;
  return !data;
}

export async function registerAccount(username: string, password: string): Promise<{ user: AuthUser | null; needsEmailConfirmation: boolean }> {
  if (!supabase) throw new Error('请先配置 Supabase URL 和 anon key');
  const cleanUsername = normalizeUsername(username);
  const { data, error } = await supabase.auth.signUp({ email: usernameEmail(cleanUsername), password, options: { data: { username: cleanUsername } } });
  if (error) throw error;
  return {
    user: data.user ? fromAuthUser(data.user) : null,
    needsEmailConfirmation: !data.session,
  };
}

export async function loginAccount(username: string, password: string): Promise<AuthUser> {
  if (!supabase) throw new Error('请先配置 Supabase URL 和 anon key');
  const { data, error } = await supabase.auth.signInWithPassword({ email: usernameEmail(username), password });
  if (error || !data.user) throw error || new Error('登录失败，请检查邮箱和密码');
  return fromAuthUser(data.user);
}

export async function logoutAccount(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? fromAuthUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}

export function getPlayerId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'argus-player-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `00000000-0000-4000-8000-${Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(12, '0')}`;
  window.localStorage.setItem(key, id);
  return id;
}

function fromRow(row: Record<string, unknown>): PlayerProfile {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    avatar: String(row.avatar || '/assets/lawyer-cat-transparent.png'),
    totalScore: Number(row.total_score || 0),
    completedLevels: Number(row.completed_levels || 0),
  };
}

export async function loadPlayerProfile(id: string): Promise<PlayerProfile | null> {
  if (!id) return null;
  if (!supabase) return readLocalProfile(id);
  const { data, error } = await supabase.from('player_profiles').select('*').eq('id', id).maybeSingle();
  if (error) {
    const local = readLocalProfile(id);
    if (local) return local;
    throw error;
  }
  return data ? fromRow(data) : readLocalProfile(id);
}

export function loadLocalPlayerProfile(id: string): PlayerProfile | null {
  return readLocalProfile(id);
}

export async function savePlayerProfile(profile: PlayerProfile): Promise<PlayerProfile> {
  if (typeof window !== 'undefined') window.localStorage.setItem(`argus-profile:${profile.id}`, JSON.stringify(profile));
  if (!supabase) return profile;
  const { data, error } = await supabase.from('player_profiles').upsert({
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    total_score: profile.totalScore,
    completed_levels: profile.completedLevels,
  }).select('*').single();
  if (error) throw error;
  return data ? fromRow(data) : profile;
}

export async function saveCampaignRun(input: {
  playerId: string;
  levelId: number;
  score: number;
  outcome: 'player_win' | 'opponent_win';
}): Promise<void> {
  if (!supabase || !input.playerId) return;
  const { error } = await supabase.from('campaign_runs').insert({
    player_id: input.playerId,
    level_id: input.levelId,
    score: input.score,
    outcome: input.outcome,
  });
  if (error) throw error;
}

export async function loadLeaderboard(limit = 8): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id,name,avatar,total_score,completed_levels')
    .order('total_score', { ascending: false })
    .order('completed_levels', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row, index) => ({ ...fromRow(row), rank: index + 1 }));
}

function readLocalProfile(id: string): PlayerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`argus-profile:${id}`);
    return raw ? JSON.parse(raw) as PlayerProfile : null;
  } catch {
    return null;
  }
}
