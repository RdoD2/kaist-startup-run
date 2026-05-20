// =====================================================================
// STARTUP RUN — 탭/스와이프 입력 핸들러
// 탭 = 점프, 스와이프 다운 = 숙이기
// =====================================================================

import * as Phaser from 'phaser';

export type InputCallback = {
  onJump: () => void;
  onDuck: () => void;
};

export type InputOptions = {
  // 이 Y 좌표 이하에서 시작된 포인터 이벤트만 점프/덕 처리
  // 상단 HUD 버튼 영역 충돌 방지용
  pointerGuardTopPx?: number;
};

const SWIPE_THRESHOLD = 40;

export class InputHandler {
  private scene: Phaser.Scene;
  private callbacks: InputCallback;
  private pointerGuardTopPx: number;

  private touchStartY: number = 0;
  private didSwipe: boolean = false;
  private pointerDownActive: boolean = false;

  private spaceKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, callbacks: InputCallback, options: InputOptions = {}) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.pointerGuardTopPx = options.pointerGuardTopPx ?? 0;
    this.register();
  }

  private register(): void {
    const { scene } = this;

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < this.pointerGuardTopPx) return;
      this.touchStartY = pointer.y;
      this.didSwipe = false;
      this.pointerDownActive = true;
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerDownActive || this.didSwipe) return;
      const dy = pointer.y - this.touchStartY;
      if (dy > SWIPE_THRESHOLD) {
        this.didSwipe = true;
        this.callbacks.onDuck();
      }
    });

    scene.input.on('pointerup', () => {
      if (!this.didSwipe && this.pointerDownActive) {
        this.callbacks.onJump();
      }
      this.pointerDownActive = false;
      this.didSwipe = false;
    });

    if (scene.input.keyboard) {
      this.spaceKey = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      );
      this.downKey = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.DOWN,
      );
    }
  }

  update(): void {
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.callbacks.onJump();
    }
    if (this.downKey && Phaser.Input.Keyboard.JustDown(this.downKey)) {
      this.callbacks.onDuck();
    }
  }

  destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');
    this.spaceKey?.destroy();
    this.downKey?.destroy();
  }
}
