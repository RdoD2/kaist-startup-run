// =====================================================================
// STARTUP RUN — 8-bit SFX + BGM 합성기 (WebAudio API)
// 외부 오디오 파일 없음 — 모두 Oscillator + GainNode로 코드 합성
// 첫 사용자 입력 후 init() 호출 (브라우저 autoplay 정책)
// =====================================================================

// BGM 멜로디 (8th note 16개 = 2 마디 루프)
// 리드: G4 B4 D5 B4 / A4 C5 E5 C5 / G4 B4 D5 B4 / A4 C5 E5 D5
const BGM_LEAD: number[] = [
  392.0, 493.88, 587.33, 493.88,
  440.0, 523.25, 659.25, 523.25,
  392.0, 493.88, 587.33, 493.88,
  440.0, 523.25, 659.25, 587.33,
];
// 베이스: 4 step마다 한 번 (G3, F3, G3, F3)
const BGM_BASS: (number | null)[] = [
  196.0, null, null, null,
  174.61, null, null, null,
  196.0, null, null, null,
  174.61, null, null, null,
];
const BGM_STEP_MS = 180; // ~166 BPM 8th notes

export class SoundFX {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;

  // BGM 상태
  private bgmTimer: ReturnType<typeof setInterval> | null = null;
  private bgmStep: number = 0;
  private bgmGain: GainNode | null = null;

  // 첫 사용자 인터랙션 후 호출. AudioContext 생성.
  init(): void {
    if (typeof window === 'undefined') return;
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // 지원 안 하는 환경 — 무시
    }
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  // 짧은 비프 (200Hz → 400Hz, 80ms, square wave)
  jump(): void {
    this.playSweep(200, 400, 0.08, 'square');
  }

  // 살짝 낮은 비프 (300Hz → 200Hz, 60ms)
  duck(): void {
    this.playSweep(300, 200, 0.06, 'square');
  }

  // 충돌 (노이즈 80ms)
  collide(): void {
    this.playNoise(0.08);
  }

  // 저음 폴 (200Hz → 50Hz, 500ms)
  death(): void {
    this.playNoise(0.08);
    this.playSweep(200, 50, 0.5, 'sawtooth');
  }

  // 상승 트릴 (C4 → E4 → G4 arpeggio, 각 80ms)
  milestone(): void {
    const notes = [261.63, 329.63, 392.0]; // C4, E4, G4
    notes.forEach((freq, i) => {
      this.playToneAt(freq, 0.08, 'square', i * 0.09);
    });
  }

  // 반복 비프 (300Hz, 100ms × 3, 200ms 간격)
  bossWarning(): void {
    for (let i = 0; i < 3; i++) {
      this.playToneAt(300, 0.1, 'square', i * 0.2);
    }
  }

  // BGM 시작 — 8th note 루프 (리드 triangle + 베이스 square)
  startBGM(): void {
    const ctx = this.getCtx();
    if (!ctx || !this.masterGain) return;
    if (this.bgmTimer) return;

    this.bgmStep = 0;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = 0.12;
    this.bgmGain.connect(this.masterGain);

    const playStep = () => {
      const lead = BGM_LEAD[this.bgmStep % BGM_LEAD.length];
      const bass = BGM_BASS[this.bgmStep % BGM_BASS.length];
      if (lead !== undefined) {
        this.playBgmNote(lead, 0.16, 'triangle');
      }
      if (bass != null) {
        this.playBgmNote(bass, 0.3, 'square', 0.6);
      }
      this.bgmStep++;
    };
    playStep();
    this.bgmTimer = setInterval(playStep, BGM_STEP_MS);
  }

  // BGM 중지 — 짧은 페이드 아웃
  stopBGM(): void {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.bgmGain && this.ctx) {
      const ctx = this.ctx;
      const g = this.bgmGain;
      this.bgmGain = null;
      try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      } catch {
        // ignore
      }
      setTimeout(() => {
        try {
          g.disconnect();
        } catch {
          // ignore
        }
      }, 300);
    }
  }

  private playBgmNote(
    hz: number,
    durationSec: number,
    type: OscillatorType,
    volumeScale: number = 1,
  ): void {
    const ctx = this.ctx;
    const bgmGain = this.bgmGain;
    if (!ctx || !bgmGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(hz, now);

    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(volumeScale, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(env);
    env.connect(bgmGain);

    osc.start(now);
    osc.stop(now + durationSec);
  }

  // =====================================================================
  // 내부 헬퍼
  // =====================================================================

  private getCtx(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx || !this.masterGain) return null;
    return this.ctx;
  }

  // 주파수 스윕 (startHz → endHz, durationSec, 파형)
  private playSweep(
    startHz: number,
    endHz: number,
    durationSec: number,
    type: OscillatorType,
    offsetSec = 0,
  ): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime + offsetSec;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startHz, now);
    osc.frequency.linearRampToValueAtTime(endHz, now + durationSec);

    // ADSR envelope: attack 5ms, release 30ms
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + 0.005);
    env.gain.setValueAtTime(1, now + durationSec - 0.03);
    env.gain.linearRampToValueAtTime(0, now + durationSec);

    osc.connect(env);
    env.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + durationSec);
  }

  // 단일 주파수 (스케줄 오프셋 지원)
  private playToneAt(
    hz: number,
    durationSec: number,
    type: OscillatorType,
    offsetSec: number,
  ): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime + offsetSec;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(hz, now);

    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + 0.005);
    env.gain.setValueAtTime(1, now + durationSec - 0.03);
    env.gain.linearRampToValueAtTime(0, now + durationSec);

    osc.connect(env);
    env.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + durationSec);
  }

  // 짧은 노이즈 버스트 (AudioBuffer + Math.random)
  private playNoise(durationSec: number): void {
    const ctx = this.getCtx();
    if (!ctx) return;

    const sampleRate = ctx.sampleRate;
    const frameCount = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const env = ctx.createGain();
    const now = ctx.currentTime;

    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.8, now + 0.005);
    env.gain.setValueAtTime(0.8, now + durationSec - 0.03);
    env.gain.linearRampToValueAtTime(0, now + durationSec);

    source.connect(env);
    env.connect(this.masterGain!);

    source.start(now);
    source.stop(now + durationSec);
  }
}

// 싱글톤 export
export const soundFX = new SoundFX();
