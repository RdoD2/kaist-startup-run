// =====================================================================
// STARTUP RUN — 탭/스페이스 입력 핸들러
// 탭/스페이스 = 점프
// =====================================================================

import * as Phaser from 'phaser';

export type InputCallback = {
  onJump: () => void;
};

export type InputOptions = {
  // 이 Y 좌표 이하에서 시작된 포인터 이벤트만 점프/덕 처리
  // 상단 HUD 버튼 영역 충돌 방지용
  pointerGuardTopPx?: number;
};

export class InputHandler {
  private scene: Phaser.Scene;
  private callbacks: InputCallback;
  private pointerGuardTopPx: number;

  private pointerDownActive: boolean = false;

  private spaceKey?: Phaser.Input.Keyboard.Key;

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
      this.pointerDownActive = true;
    });

    scene.input.on('pointerup', () => {
      if (this.pointerDownActive) {
        this.callbacks.onJump();
      }
      this.pointerDownActive = false;
    });

    if (scene.input.keyboard) {
      this.spaceKey = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      );
    }
  }

  update(): void {
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.callbacks.onJump();
    }
  }

  destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointerup');
    this.spaceKey?.destroy();
  }
}
