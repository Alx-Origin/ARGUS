import assert from 'node:assert/strict';
import test from 'node:test';
import { createCourtSfx, soundForEffect } from './court-sfx.ts';

function fakeContext(state = 'running') {
  const nodes = [];
  const parameter = () => ({ value: 0, values: [],
    setValueAtTime(value, at) { this.values.push({ value, at }); },
    exponentialRampToValueAtTime(value, at) { this.values.push({ value, at }); },
  });
  const node = (kind) => {
    const item = { kind, disconnected: false, starts: [], stops: [], onended: null,
      connect() {}, disconnect() { this.disconnected = true; },
      start(at) { this.starts.push(at); }, stop(at) { this.stops.push(at); },
    };
    nodes.push(item);
    return item;
  };
  const context = {
    state, currentTime: 10, sampleRate: 22050, destination: {}, nodes, resumes: 0,
    createGain() { return Object.assign(node('gain'), { gain: parameter() }); },
    createOscillator() { return Object.assign(node('tone'), { frequency: parameter() }); },
    createBufferSource() { return node('noise'); },
    createBiquadFilter() { return Object.assign(node('filter'), { frequency: parameter() }); },
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; },
    resume() { this.resumes++; this.state = 'running'; return Promise.resolve(); },
    close() { this.state = 'closed'; return Promise.resolve(); },
  };
  return context;
}

test('committed player, recovery and opponent effects select distinct sounds', () => {
  assert.equal(soundForEffect({ side: 'player', kind: 'objection' }), 'card');
  assert.equal(soundForEffect({ side: 'player', kind: 'shield' }), 'recover');
  assert.equal(soundForEffect({ side: 'opponent', kind: 'objection' }), 'hit');
});

test('context is lazy, unlocked once, and one-shots stop and disconnect', () => {
  const context = fakeContext('suspended');
  let created = 0;
  const sound = createCourtSfx(() => { created++; return context; });
  sound.play('card');
  assert.equal(created, 0);
  sound.unlock(); sound.unlock();
  assert.equal(created, 1);
  assert.equal(context.resumes, 1);
  sound.play('card');
  const sources = context.nodes.filter((n) => n.kind === 'tone' || n.kind === 'noise');
  assert.equal(sources.length, 4);
  assert.ok(sources.every((n) => n.starts.length === 1 && n.stops[0] > n.starts[0] && n.stops[0] < 10.4));
  sources.forEach((n) => n.onended());
  assert.ok(sources.every((n) => n.disconnected));
});

test('counterattack is low and percussive, recovery is three gentle tones', () => {
  const hitContext = fakeContext();
  const hit = createCourtSfx(() => hitContext); hit.unlock(); hit.play('hit');
  const hitTones = hitContext.nodes.filter((n) => n.kind === 'tone');
  assert.ok(hitTones.every((n) => n.frequency.values[0].value <= 160));
  assert.equal(hitContext.nodes.filter((n) => n.kind === 'noise').length, 1);
  const recoveryContext = fakeContext();
  const recovery = createCourtSfx(() => recoveryContext); recovery.unlock(); recovery.play('recover');
  assert.equal(recoveryContext.nodes.filter((n) => n.kind === 'noise').length, 0);
  assert.deepEqual(recoveryContext.nodes.filter((n) => n.kind === 'tone').map((n) => n.frequency.values[0].value), [440, 620, 820]);
});

test('leaving court closes audio, stops pending sounds and prevents late playback', () => {
  const context = fakeContext();
  const sound = createCourtSfx(() => context); sound.unlock(); sound.play('card');
  sound.dispose();
  assert.equal(context.state, 'closed');
  assert.ok(context.nodes.filter((n) => n.kind === 'tone' || n.kind === 'noise').every((n) => n.stops.length === 2));
  const count = context.nodes.length;
  sound.unlock(); sound.play('hit'); sound.dispose();
  assert.equal(context.nodes.length, count);
});

test('unsupported or blocked audio stays silent without breaking gameplay', async () => {
  for (const create of [() => null, () => { throw new Error('unavailable'); }]) {
    const sound = createCourtSfx(create);
    assert.doesNotThrow(() => { sound.unlock(); sound.play('hit'); sound.dispose(); });
  }
  const context = fakeContext('suspended');
  context.resume = () => Promise.reject(new Error('autoplay blocked'));
  const sound = createCourtSfx(() => context); sound.unlock(); sound.play('card');
  await Promise.resolve();
  assert.equal(context.nodes.filter((n) => n.kind === 'tone' || n.kind === 'noise').length, 0);
  sound.dispose();
});
