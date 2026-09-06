export const HAND_SIZE = 4;
export const PLAYER_MAX_HP = 20;
export const PLAYER_MAX_STAMINA = 10;
export const TURN_SECONDS = 15;
// The player's hit animation lasts ~1.1s; leave a readable pause after it.
export const OPPONENT_REACTION_DELAY_MS = 2000;
const TIMEOUT_DAMAGE = 2;

export type BattleCard = {
  id: string; evidenceId: string | null; name: string; nature: string;
  key: boolean; value: number; credibility: number; text: string;
  cost: number; effectText: string; staminaRecovery: number;
};
export type BattleStage = 'idle' | 'player' | 'player-action' | 'opponent-action' | 'finished';
export type BattleEffect = { side: 'player' | 'opponent'; label: string; kind: 'objection' | 'shield' };
export type BattleState = {
  hand: BattleCard[]; drawPile: BattleCard[]; discardPile: BattleCard[];
  playerHp: number; enemyHp: number; stamina: number; turn: number;
  cardsPlayed: number; stage: BattleStage;
  result: 'player_win' | 'opponent_win' | null; effect: BattleEffect | null;
};

// Recovery is an action card, never a passive turn bonus or a court exhibit.
export const RECOVERY_CARDS: BattleCard[] = [
  {
    id: 'recover-breath', evidenceId: null, name: '深呼吸', nature: '体力恢复',
    key: false, value: 0, credibility: 0, cost: 0, staminaRecovery: 3,
    effectText: '恢复 3 点体力 · 不造成伤害',
    text: '稳住节奏，恢复体力。消耗一次出牌机会，之后对方仍会反击；满体力不可用。',
  },
  {
    id: 'recover-organize', evidenceId: null, name: '整理思路', nature: '体力恢复',
    key: false, value: 0, credibility: 0, cost: 1, staminaRecovery: 5,
    effectText: '消耗后恢复 5 点体力 · 净恢复最多 4 点',
    text: '先消耗 1 点体力，再恢复 5 点，上限 10 点。消耗一次出牌机会；满体力不可用。',
  },
];

export function emptyBattle(enemyHp: number): BattleState {
  return {
    hand: [], drawPile: [], discardPile: [], playerHp: PLAYER_MAX_HP, enemyHp,
    stamina: PLAYER_MAX_STAMINA, turn: 1, cardsPlayed: 0, stage: 'idle', result: null, effect: null,
  };
}

export function canAffordCard(card: BattleCard, stamina: number) {
  return card.cost <= stamina && !(card.staminaRecovery > 0 && stamina >= PLAYER_MAX_STAMINA);
}

// A seed is supplied by the event handler. Reducer replays (including Strict Mode)
// must draw the same cards, without advancing a global random generator.
function randomFrom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function shuffled<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function refillHand(state: BattleState, random: () => number): BattleState {
  const hand = [...state.hand];
  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];
  while (hand.length < HAND_SIZE) {
    if (!drawPile.length) {
      drawPile = shuffled(discardPile, random);
      discardPile = [];
    }
    if (!drawPile.length) break;
    // With no passive regeneration, protect the last slot from a resource lock.
    // Only the replacement is selected specially; the other three cards stay put.
    if (hand.length === HAND_SIZE - 1 && !hand.some((card) => canAffordCard(card, state.stamina))) {
      const playableIndex = drawPile.findIndex((card) => canAffordCard(card, state.stamina));
      if (playableIndex >= 0) {
        hand.push(drawPile.splice(playableIndex, 1)[0]);
        continue;
      }
      const recycledIndex = discardPile.findIndex((card) => canAffordCard(card, state.stamina));
      if (recycledIndex >= 0) {
        hand.push(discardPile.splice(recycledIndex, 1)[0]);
        continue;
      }
    }
    hand.push(drawPile.shift()!);
  }
  return { ...state, hand, drawPile, discardPile };
}

export type BattleAction =
  | { type: 'start'; deck: BattleCard[]; selectedIds: string[]; enemyHp: number; seed: number }
  | { type: 'play'; cardId: string; seed: number }
  | { type: 'opponent'; levelId: number; timeout?: boolean }
  | { type: 'next' }
  | { type: 'reset'; enemyHp: number };

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  if (action.type === 'reset') return emptyBattle(action.enemyHp);
  if (action.type === 'start') {
    if (!action.deck.length) return emptyBattle(action.enemyHp);
    const templates = [...action.deck, ...RECOVERY_CARDS];
    // A small investigation still gets four cards and a nonempty draw pile.
    // Extra copies use only collected evidence, never undiscovered exhibits.
    const cards = [...templates];
    while (cards.length < HAND_SIZE + 2) cards.push(templates[cards.length % templates.length]);
    const instances = cards.map((card, index) => ({ ...card, id: `${card.id}-instance-${index}` }));
    const hand = [...new Set(action.selectedIds)].slice(0, HAND_SIZE)
      .map((id) => instances.find((card) => card.evidenceId === id))
      .filter((card): card is BattleCard => Boolean(card));
    const random = randomFrom(action.seed);
    return refillHand({
      ...emptyBattle(action.enemyHp), stage: 'player', hand,
      drawPile: shuffled(instances.filter((card) => !hand.includes(card)), random),
    }, random);
  }
  if (state.result) return state;
  if (action.type === 'play') {
    if (state.stage !== 'player') return state;
    const card = state.hand.find((item) => item.id === action.cardId);
    if (!card || !canAffordCard(card, state.stamina)) return state;
    const stamina = Math.min(PLAYER_MAX_STAMINA, state.stamina - card.cost + card.staminaRecovery);
    const enemyHp = Math.max(0, state.enemyHp - card.value);
    return refillHand({
      ...state, enemyHp, stamina, cardsPlayed: state.cardsPlayed + 1,
      hand: state.hand.filter((item) => item.id !== card.id), discardPile: [...state.discardPile, card],
      stage: enemyHp === 0 ? 'finished' : 'player-action', result: enemyHp === 0 ? 'player_win' : null,
      effect: {
        side: 'player', kind: card.staminaRecovery ? 'shield' : 'objection',
        label: card.staminaRecovery ? `体力 +${stamina - state.stamina}` : `异议！-${Math.min(state.enemyHp, card.value)}`,
      },
    }, randomFrom(action.seed));
  }
  if (action.type === 'opponent') {
    if (state.stage !== (action.timeout ? 'player' : 'player-action')) return state;
    const damage = action.timeout ? TIMEOUT_DAMAGE : 2 + ((state.turn + action.levelId) % 4);
    const playerHp = Math.max(0, state.playerHp - damage);
    return {
      ...state, playerHp, stage: playerHp === 0 ? 'finished' : 'opponent-action',
      result: playerHp === 0 ? 'opponent_win' : null,
      effect: { side: 'opponent', kind: 'objection', label: `${action.timeout ? '超时反击' : '反击！'} -${Math.min(state.playerHp, damage)}` },
    };
  }
  if (action.type === 'next' && state.stage === 'opponent-action') {
    // Deliberately no stamina regeneration, even after a timeout.
    return { ...state, stage: 'player', turn: state.turn + 1, effect: null };
  }
  return state;
}
