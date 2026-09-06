import type { BattleEffect } from './court-battle';

export type CourtSound = 'card' | 'hit' | 'recover';

export function soundForEffect(effect: BattleEffect): CourtSound {
  return effect.side === 'opponent' ? 'hit' : effect.kind === 'shield' ? 'recover' : 'card';
}

function browserAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Constructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Constructor ? new Constructor() : null;
}

/** Short synthesized one-shots: no downloads, extra media files or delayed playback queue. */
export function createCourtSfx(createContext: () => AudioContext | null = browserAudioContext) {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let disposed = false;
  const active = new Set<AudioScheduledSourceNode>();

  function unlock() {
    if (disposed) return;
    try {
      if (!context) {
        context = createContext();
        if (!context) return;
        master = context.createGain();
        master.gain.value = 0.5;
        master.connect(context.destination);
      }
      if (context.state === 'suspended') void context.resume().catch(() => undefined);
    } catch {
      // Audio support/autoplay failure must never interrupt a turn.
    }
  }

  function startSource(source: AudioScheduledSourceNode, nodes: AudioNode[], at: number, duration: number) {
    active.add(source);
    source.onended = () => {
      active.delete(source);
      source.disconnect();
      nodes.forEach((node) => node.disconnect());
    };
    source.start(at);
    source.stop(at + duration + 0.025);
  }

  function tone(frequency: number, to: number, duration: number, volume: number, delay = 0, type: OscillatorType = 'triangle') {
    const audio = context!;
    const at = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(to, at + duration);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(master!);
    startSource(oscillator, [gain], at, duration);
  }

  function noise(duration: number, frequency: number, volume: number, delay = 0, type: BiquadFilterType = 'bandpass') {
    const audio = context!;
    const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = buffer;
    filter.type = type;
    filter.frequency.value = frequency;
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master!);
    startSource(source, [filter, gain], audio.currentTime + delay, duration);
  }

  function play(sound: CourtSound) {
    if (disposed || context?.state !== 'running' || !master) return;
    try {
      if (sound === 'card') {
        // Papery swish followed by a short, bright impact.
        noise(0.10, 2000, 0.14);
        tone(520, 850, 0.10, 0.09);
        noise(0.13, 950, 0.20, 0.07, 'lowpass');
        tone(200, 82, 0.14, 0.16, 0.07);
      } else if (sound === 'hit') {
        // Lower and heavier than the player's play; starts with the counterattack.
        noise(0.20, 760, 0.25, 0, 'lowpass');
        tone(160, 58, 0.22, 0.22, 0, 'sine');
        tone(100, 65, 0.14, 0.08, 0.025, 'triangle');
      } else {
        [440, 620, 820].forEach((frequency, index) => tone(frequency, frequency * 1.1, 0.13, 0.08, index * 0.055, 'sine'));
      }
    } catch {
      // A closed/interrupted audio device is cosmetic, not a gameplay failure.
    }
  }

  function dispose() {
    disposed = true;
    active.forEach((source) => { try { source.stop(); } catch { /* Already stopped. */ } });
    active.clear();
    master?.disconnect();
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
    context = null;
    master = null;
  }

  return { unlock, play, dispose };
}
