import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { battleReducer, canAffordCard, emptyBattle, HAND_SIZE, PLAYER_MAX_SHIELD, PLAYER_MAX_STAMINA, TURN_SECONDS } from './court-battle.ts';

const exhibit = (index, cost = 4, damage = 7) => ({
  id: `evidence-${index}`, evidenceId: `e${index}`, name: `证据 ${index}`, nature: '书证',
  key: true, value: damage, credibility: 9, text: '真实的本关证据',
  cost, effectText: `造成 ${damage} 点伤害`, staminaRecovery: 0,
});
const start = (deck = [1, 2, 3, 4, 5, 6].map((id) => exhibit(id)), seed = 42) => battleReducer(emptyBattle(1000), {
  type: 'start', deck, selectedIds: deck.slice(0, HAND_SIZE).map((card) => card.evidenceId), enemyHp: 1000, seed,
});
const play = (state, card, seed = 43) => battleReducer(state, { type: 'play', cardId: card.id, seed });
const next = (state) => battleReducer(battleReducer(state, { type: 'opponent', levelId: 1 }), { type: 'next' });
const allCards = (state) => [...state.hand, ...state.drawPile, ...state.discardPile];

test('starts full, keeps selected exhibits, adds recovery to the deck', () => {
  assert.equal(TURN_SECONDS, 25);
  const state = start();
  assert.equal(state.stamina, PLAYER_MAX_STAMINA);
  assert.equal(state.playerHp, 20);
  assert.equal(state.enemyHp, 1000);
  assert.equal(state.hand.length, 4);
  assert.deepEqual(state.hand.map((c) => c.evidenceId), ['e1', 'e2', 'e3', 'e4']);
  assert.ok(state.drawPile.some((c) => c.cost === 0 && c.staminaRecovery > 0));
  assert.ok(state.drawPile.some((c) => c.shieldGain > 0));
  assert.equal(state.playerShield, 0);
});

test('defense cards spend stamina and add capped shield without fabricating evidence', () => {
  const initial = start();
  const card = initial.drawPile.find((c) => c.shieldGain === 5);
  assert.ok(card);
  const state = { ...initial, hand: [card, ...initial.hand.slice(1)], stamina: 1 };
  const after = play(state, card);
  assert.equal(after.stamina, 0);
  assert.equal(after.playerShield, 5);
  assert.equal(after.enemyHp, state.enemyHp);
  assert.equal(after.stage, 'player-action');
  assert.equal(after.effect.kind, 'shield');
  assert.equal(after.effect.label, '护盾 +5');
  assert.equal(after.discardPile.at(-1).evidenceId, null);
  assert.equal(canAffordCard(card, 1, PLAYER_MAX_SHIELD), false);
});

test('shield absorbs counterattack damage before health, including timeout damage', () => {
  const initial = start();
  const card = initial.drawPile.find((c) => c.shieldGain === 8);
  const state = { ...initial, hand: [card, ...initial.hand.slice(1)], stamina: 2 };
  const shielded = play(state, card);
  const blocked = battleReducer(shielded, { type: 'opponent', levelId: 1 });
  assert.equal(blocked.playerShield, 4);
  assert.equal(blocked.playerHp, 20);
  const nextTurn = battleReducer(blocked, { type: 'next' });
  const timeout = battleReducer(nextTurn, { type: 'opponent', levelId: 1, timeout: true });
  assert.equal(timeout.playerShield, 2);
  assert.equal(timeout.playerHp, 20);
  assert.match(timeout.effect.label, /护盾吸收 2/);
});

test('remaining shield persists across turns and only fully breaks when damage exceeds it', () => {
  const state = { ...start(), playerShield: 2, playerHp: 20 };
  const hit = battleReducer({ ...state, stage: 'player-action' }, { type: 'opponent', levelId: 1 });
  assert.equal(hit.playerShield, 0);
  assert.equal(hit.playerHp, 18);
  assert.match(hit.effect.label, /护盾吸收 2 · 受伤 -2/);
});

test('even one collected exhibit fills all four slots without inventing evidence', () => {
  const state = start([exhibit(1)]);
  assert.equal(state.hand.length, 4);
  assert.ok(allCards(state).every((c) => c.evidenceId === null || c.evidenceId === 'e1'));
  assert.equal(new Set(allCards(state).map((c) => c.id)).size, allCards(state).length);
});

test('fewer than four selected exhibits keep only those evidence types plus tactics', () => {
  const deck = [1, 2, 3, 4, 5, 6].map((id) => exhibit(id));
  const state = battleReducer(emptyBattle(1000), {
    type: 'start', deck, selectedIds: ['e2', 'e5'], enemyHp: 1000, seed: 42,
  });
  assert.equal(state.hand.length, 4);
  assert.deepEqual(new Set(allCards(state).filter((card) => card.evidenceId).map((card) => card.evidenceId)), new Set(['e2', 'e5']));
  assert.ok(allCards(state).every((card) => card.evidenceId === null || card.evidenceId === 'e2' || card.evidenceId === 'e5'));
});

test('unaffordable, unknown and full-stamina recovery plays change nothing', () => {
  const state = { ...start(), stamina: 3 };
  assert.equal(play(state, state.hand[0]), state);
  assert.equal(battleReducer(state, { type: 'play', cardId: 'unknown', seed: 2 }), state);
  const recovery = state.drawPile.find((c) => c.staminaRecovery > 0);
  const full = { ...state, stamina: 10, hand: [recovery, ...state.hand.slice(1)] };
  assert.equal(play(full, recovery), full);
});

test('exact-cost attack consumes stamina once, refills hand and locks rapid follow-up clicks', () => {
  const state = { ...start(), stamina: 4 };
  const after = play(state, state.hand[0]);
  assert.equal(after.stamina, 0);
  assert.equal(after.enemyHp, 993);
  assert.equal(after.playerHp, state.playerHp, 'player does not take damage during the reaction pause');
  assert.equal(after.hand.length, 4);
  assert.equal(after.cardsPlayed, 1);
  assert.equal(after.stage, 'player-action');
  assert.equal(battleReducer(after, { type: 'next' }), after, 'cannot skip the delayed counterattack');
  assert.ok(after.hand.some((c) => c.cost === 0 && c.staminaRecovery > 0));
  assert.equal(play(after, after.hand[0]), after);
  assert.equal(play(after, state.hand[0]), after);
  assert.equal(allCards(after).length, allCards(state).length);
});

test('attacks, enemy counters and next turns never regenerate stamina', () => {
  const state = start();
  const after = play(state, state.hand[0]);
  const opponent = battleReducer(after, { type: 'opponent', levelId: 1 });
  assert.equal(opponent.playerHp, 16);
  assert.equal(opponent.stamina, 6);
  const following = battleReducer(opponent, { type: 'next' });
  assert.equal(following.stamina, 6);
  assert.equal(following.turn, 2);
  assert.equal(following.stage, 'player');
});

test('timeout costs health, not cards or stamina; only one counter per timeout', () => {
  const state = { ...start(), stamina: 2 };
  const timedOut = battleReducer(state, { type: 'opponent', levelId: 1, timeout: true });
  assert.equal(timedOut.playerHp, 18);
  assert.equal(timedOut.stamina, 2);
  assert.deepEqual(timedOut.hand, state.hand);
  assert.equal(battleReducer(timedOut, { type: 'opponent', levelId: 1, timeout: true }), timedOut);
  assert.equal(battleReducer(timedOut, { type: 'next' }).stamina, 2);
});

test('zero-cost recovery can be used at zero and still gives the opponent a turn', () => {
  let state = { ...start(), stamina: 4 };
  state = next(play(state, state.hand[0]));
  const card = state.hand.find((c) => c.cost === 0 && c.staminaRecovery > 0);
  const after = play(state, card);
  assert.equal(after.stamina, 3);
  assert.equal(after.enemyHp, state.enemyHp);
  assert.equal(after.hand.length, 4);
  assert.equal(after.stage, 'player-action');
  assert.ok(next(after).playerHp < after.playerHp);
});

test('paid recovery must be affordable, subtracts cost first, and never exceeds maximum', () => {
  const initial = start();
  const card = initial.drawPile.find((c) => c.cost === 1 && c.staminaRecovery > 0);
  const state = { ...initial, hand: [card, ...initial.hand.slice(1)], stamina: 0 };
  assert.equal(play(state, card), state);
  assert.equal(play({ ...state, stamina: 1 }, card).stamina, 5);
  assert.equal(play({ ...state, stamina: 9 }, card).stamina, 10);
});

test('terminal win/loss blocks all later card, timeout and counter actions', () => {
  const state = start();
  const won = play({ ...state, enemyHp: 1 }, state.hand[0]);
  assert.equal(won.result, 'player_win');
  assert.equal(won.enemyHp, 0);
  assert.equal(won.playerHp, 20);
  assert.equal(battleReducer(won, { type: 'opponent', levelId: 1 }), won);
  assert.equal(play(won, won.hand[0]), won);
  const lost = battleReducer({ ...state, playerHp: 1 }, { type: 'opponent', levelId: 1, timeout: true });
  assert.equal(lost.playerHp, 0);
  assert.equal(lost.result, 'opponent_win');
  assert.equal(play(lost, lost.hand[0]), lost);
});

test('reset and restart clear old hands, resources, outcomes and animation stage', () => {
  const state = next(play(start(), start().hand[0]));
  const reset = battleReducer(state, { type: 'reset', enemyHp: 27 });
  assert.deepEqual(reset, emptyBattle(27));
  assert.equal(battleReducer(reset, { type: 'opponent', levelId: 1 }), reset);
});

test('seeded reducer is replay-safe, random draws vary, inputs remain unchanged', () => {
  const state = start();
  const original = structuredClone(state);
  const action = { type: 'play', cardId: state.hand[0].id, seed: 7 };
  assert.deepEqual(battleReducer(state, action), battleReducer(state, action));
  assert.deepEqual(state, original);
  const draws = new Set(Array.from({ length: 20 }, (_, seed) => start(undefined, seed).drawPile[0].id));
  assert.ok(draws.size > 1);
});

test('100 seeds × 40 plays: always four cards, affordable option, recyclable discard, conserved deck', () => {
  for (let seed = 0; seed < 100; seed++) {
    // Extra HP isolates deck/energy endurance from the intentionally finite battle.
    let state = { ...start(undefined, seed), playerHp: 1000 };
    const count = allCards(state).length;
    for (let i = 0; i < 40; i++) {
      const card = state.hand.find((c) => c.staminaRecovery === 0 && canAffordCard(c, state.stamina))
        || state.hand.find((c) => canAffordCard(c, state.stamina));
      assert.ok(card, `no playable card at seed ${seed}, play ${i}`);
      state = next(play(state, card, seed * 100 + i));
      assert.equal(state.cardsPlayed, i + 1);
      assert.equal(state.hand.length, 4);
      assert.equal(allCards(state).length, count);
      assert.equal(new Set(allCards(state).map((c) => c.id)).size, count);
      assert.ok(state.stamina >= 0 && state.stamina <= 10);
    }
  }
});

test('actual ten campaign cases keep each collected deck scoped and playable past four uses', () => {
  const require = createRequire(import.meta.url);
  const { campaignCases } = require('../../../backend/src/campaign-cases.js');
  for (const campaign of campaignCases) {
    const deck = campaign.evidence.map((item, i) => ({ ...exhibit(i, 3, 5), evidenceId: item.id }));
    let state = { ...start(deck, campaign.levelId), playerHp: 1000 };
    for (let i = 0; i < 12; i++) {
      const card = state.hand.find((c) => canAffordCard(c, state.stamina));
      assert.ok(card);
      state = next(play(state, card, i));
      assert.equal(state.hand.length, 4);
      assert.ok(allCards(state).every((c) => c.evidenceId === null || campaign.evidence.some((e) => e.id === c.evidenceId)));
    }
  }
});
