import { readUiPreferences } from '@/lib/uiPreferences';

export type AudioCue =
  | 'save'
  | 'generate'
  | 'error'
  | 'undo'
  | 'redo'
  | 'delete'
  | 'wire'
  | 'success';

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function tone(
  frequency: number,
  durationMs: number,
  volume: number,
  type: OscillatorType = 'sine'
): void {
  const ac = ctx();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  const t = ac.currentTime;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + durationMs / 1000 + 0.02);
}

const CUE_PROFILE: Record<AudioCue, { freq: number; ms: number; type?: OscillatorType }> = {
  save: { freq: 520, ms: 55 },
  generate: { freq: 640, ms: 70 },
  success: { freq: 720, ms: 60 },
  error: { freq: 220, ms: 90, type: 'triangle' },
  undo: { freq: 380, ms: 45 },
  redo: { freq: 460, ms: 45 },
  delete: { freq: 280, ms: 50, type: 'triangle' },
  wire: { freq: 880, ms: 28 },
};

/** Subtle UI sounds — respects App settings (off by default). */
export function playAudioCue(cue: AudioCue): void {
  const prefs = readUiPreferences();
  if (!prefs.audioFeedbackEnabled) return;
  const vol = Math.min(1, Math.max(0, prefs.audioFeedbackVolume ?? 0.35));
  const profile = CUE_PROFILE[cue];
  tone(profile.freq, profile.ms, vol * 0.12, profile.type);
}
