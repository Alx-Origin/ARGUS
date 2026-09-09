'use client';

import { artworkFor, type SceneArt } from '../lib/evidence-art';
import type { Locale } from '../lib/localization';
export { artworkFor, exhibitKey, type SceneArt } from '../lib/evidence-art';

/**
 * Cat-themed rendering for campaign evidence. Artwork is decorative: every fact a
 * player can act on still comes from the backend document text rendered below it.
 */

type Hotspot = { id: string; evidenceId: string; label: string };
export type EvidenceDocument = { id: string; name: string; type: string; content: string; hotspots: Hotspot[] };

const ART_ALT: Record<Locale, Record<SceneArt, string>> = {
  zh: {
    wall: '猫咪主题插画：墙面痕迹现场',
    furniture: '猫咪主题插画：家具磨损现场',
    checkout: '猫咪主题插画：交接与钥匙',
    chat: '猫咪主题插画：手机聊天记录',
    desk: '猫咪主题插画：文件桌与合同',
  },
  en: {
    wall: 'Cat illustration: wall marks at the scene',
    furniture: 'Cat illustration: worn furniture at the scene',
    checkout: 'Cat illustration: handover and keys',
    chat: 'Cat illustration: chat on a phone',
    desk: 'Cat illustration: document desk and contract',
  },
};

const COPY: Record<Locale, {
  archive: string;
  bothSides: string;
  original: string;
  scene: string;
  notPhoto: string;
  signatures: string;
  decorative: string;
  collected: string;
  collect: string;
  plaintiff: string;
  defendant: string;
}> = {
  zh: {
    archive: 'MEOW COURT · 证据档案',
    bothSides: '我方 ↔ 对方',
    original: '查看完整原文',
    scene: '场景示意插画 · 非原始照片',
    notPhoto: '猫爪签印为主题装饰，非原件签署信息',
    signatures: '甲方 / 乙方',
    decorative: '【虚构训练材料】',
    collected: '已收集证据 ✓ · 点击取消',
    collect: '点击收集证据',
    plaintiff: '我方',
    defendant: '对方',
  },
  en: {
    archive: 'MEOW COURT · Evidence file',
    bothSides: 'Our side ↔ Opponent',
    original: 'View full original',
    scene: 'Scene illustration · not the original photo',
    notPhoto: 'Paw stamps are decorative and not original signatures',
    signatures: 'Party A / Party B',
    decorative: '[Fictional training material]',
    collected: 'Collected ✓ · click to remove',
    collect: 'Click to collect evidence',
    plaintiff: 'Our side',
    defendant: 'Opponent',
  },
};

export function EvidenceArtwork({ art, className = 'evidence-art', locale = 'zh' }: { art: SceneArt; className?: string; locale?: Locale }) {
  return <img className={className} src={`/assets/evidence/${art}-anime.webp`} alt={ART_ALT[locale][art]} loading="lazy" />;
}

export function CatPortrait({ opponent = false, label, locale = 'zh' }: { opponent?: boolean; label?: string; locale?: Locale }) {
  return <img
    className="evidence-cat"
    src={`/assets/evidence/${opponent ? 'landlord' : 'tenant'}-cat-transparent.webp`}
    alt={label || (opponent ? (locale === 'en' ? 'Opponent cat avatar' : '对方猫咪形象') : (locale === 'en' ? 'Our cat avatar' : '我方猫咪形象'))}
    loading="lazy"
  />;
}

export function PawStamp() {
  return <svg viewBox="0 0 64 64" className="evidence-paw" aria-hidden="true"><g fill="currentColor">
    <ellipse cx="15" cy="24" rx="7" ry="10" transform="rotate(-25 15 24)" />
    <ellipse cx="28" cy="16" rx="7" ry="10" />
    <ellipse cx="43" cy="18" rx="7" ry="10" transform="rotate(15 43 18)" />
    <ellipse cx="53" cy="31" rx="6" ry="9" transform="rotate(30 53 31)" />
    <path d="M18 43c2-8 8-16 16-15s14 11 15 20c1 12-11 5-16 6s-19 2-15-11Z" />
  </g></svg>;
}

const TRAINING_NOTICE = '【虚构训练材料】';
type ChatLine = { stamp: string; speaker: string; body: string } | null;

/**
 * Speaker labels are not clean party names: cases mix bare names ("张某"), roles ("客服")
 * and name-plus-verb compounds ("周某发送", "采购公司提交盖章函"). Match on the personal
 * name first, then on any shared multi-character run, so compounds still land on our side.
 */
export function speakerIsPlayer(speaker: string, playerSide: string) {
  if (playerSide.includes(speaker)) return true;
  const person = speaker.match(/[一-龥]某/);
  if (person) return playerSide.includes(person[0]);
  for (let length = Math.min(speaker.length, 6); length >= 2; length -= 1) {
    for (let start = 0; start + length <= speaker.length; start += 1) {
      if (playerSide.includes(speaker.slice(start, start + length))) return true;
    }
  }
  return false;
}

/**
 * Case documents use several timestamp conventions ("2026-02-20 09:14 张某：", "10:32 胡某：",
 * "05-11周某发送：", bare "赵某："). Lines that are footnotes rather than dialogue return null
 * and are rendered as plain notes instead of being forced into a speech bubble.
 */
export function parseChatLine(line: string): ChatLine {
  const index = (() => {
    const full = line.indexOf('：');
    const ascii = line.indexOf(':');
    if (full < 0) return ascii;
    if (ascii < 0) return full;
    return Math.min(full, ascii);
  })();
  if (index < 0) return null;
  const head = line.slice(0, index);
  const body = line.slice(index + 1);
  const stamp = (head.match(/^[\d\s:：年月日\-./]*/) || [''])[0].trim();
  const speaker = head.slice(stamp.length).trim();
  if (!body.trim() || !speaker) return null;
  const named = speaker.length <= 4 && !/[（(]/.test(speaker);
  return stamp || named ? { stamp, speaker, body } : null;
}

function contentLines(content: string) {
  return content.split('\n').filter((line) => line.trim() && line.trim() !== TRAINING_NOTICE);
}

function isAgreement(name: string) {
  return /合同|协议|条款|contract|agreement|terms/i.test(name);
}

export function CatDocument({ doc, playerSide, discovered, onDiscover, locale = 'zh' }: {
  doc: EvidenceDocument;
  playerSide: string;
  discovered: string[];
  onDiscover: (evidenceId: string, label: string) => void;
  locale?: Locale;
}) {
  const copy = COPY[locale];
  const art = artworkFor(doc.id, doc.type);
  const lines = contentLines(doc.content);
  const isChat = doc.type === 'chat';
  const isPhoto = doc.type === 'image' || doc.type === 'img';

  return <div className={`cat-document ${isChat ? 'document-chat' : ''}`}>
    <div className="document-art-label"><PawStamp /><span>{copy.archive}</span><em>{copy.decorative}</em></div>

    {isChat ? <>
      <div className="cat-chat-heading">
        <CatPortrait locale={locale} />
        <div><strong>{doc.name}</strong><small>{copy.bothSides}</small></div>
        <CatPortrait opponent locale={locale} />
      </div>
      <div className="cat-chat-messages">{lines.map((line, index) => {
        const parsed = parseChatLine(line);
        if (!parsed) return <p className="chat-note" key={index}>{line}</p>;
        const mine = speakerIsPlayer(parsed.speaker, playerSide);
        return <article key={index} className={`cat-message ${mine ? 'tenant-message' : ''}`}>
          {parsed.stamp && <time>{parsed.stamp}</time>}
          <div className="cat-message-row">
            <CatPortrait opponent={!mine} locale={locale} label={`${parsed.speaker}${locale === 'en' ? '\'s cat portrait' : '的猫咪形象'}`} />
            <div><small>{parsed.speaker}{locale === 'en' ? ': ' : '：'}</small><p>{parsed.body}</p></div>
          </div>
        </article>;
      })}</div>
    </> : <>
      <div className="document-heading">
        <EvidenceArtwork art={art} locale={locale} />
        <strong>{doc.name}</strong>
        <CatPortrait opponent locale={locale} />
      </div>
      {isPhoto && <figure className="cat-photo">
        <EvidenceArtwork art={art} locale={locale} />
        <figcaption>{copy.scene}</figcaption>
      </figure>}
      <div className="document-original-copy">{lines.map((line, index) => (
        index === 0 && isAgreement(doc.name) ? <h3 key={index}>{line}</h3> : <p key={index}>{line}</p>
      ))}</div>
      {isAgreement(doc.name) && <>
        <div className="cat-signatures">
          <div><CatPortrait opponent locale={locale} /><span>{locale === 'en' ? 'Party A' : '甲方'}</span><PawStamp /></div>
          <div><CatPortrait locale={locale} /><span>{locale === 'en' ? 'Party B' : '乙方'}</span><PawStamp /></div>
        </div>
        <p className="art-caption">{copy.notPhoto}</p>
      </>}
    </>}

    <div className="document-clues">{doc.hotspots.map((spot) => {
      const found = discovered.includes(spot.evidenceId);
      return <button type="button" key={spot.id} className={`source-hotspot ${found ? 'found' : ''}`} onClick={() => onDiscover(spot.evidenceId, spot.label)} aria-pressed={found}>
        <PawStamp />
        <span>{spot.label}<small>{found ? copy.collected : copy.collect}</small></span>
      </button>;
    })}</div>

    <details className="document-plain-text"><summary>{copy.original}</summary><pre>{doc.content}</pre></details>
  </div>;
}
