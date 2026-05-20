// =====================================================================
// STARTUP RUN — 게임 시작 함수
// Phaser 인스턴스 생성 + scene 등록
// =====================================================================

import * as Phaser from 'phaser';
import { CANVAS, PALETTE } from '@/lib/constants';
import { GameScene, type GameOverResult } from './GameScene';

export type { GameOverResult };

export type StartGameResult = {
  destroy: () => void;
};

/**
 * Phaser 게임 인스턴스를 생성하고 GameScene을 시작합니다.
 *
 * @param parent - Phaser 캔버스를 마운트할 DOM 엘리먼트
 * @param sessionId - 현재 게임 세션 ID (UI에서 채워줌)
 * @param onGameOver - 게임 종료 콜백
 * @returns destroy() 함수를 포함한 객체 (언마운트 시 호출)
 */
export function startGame(
  parent: HTMLElement,
  sessionId: string,
  onGameOver: (result: GameOverResult) => void,
): StartGameResult {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: CANVAS.width,
    height: CANVAS.height,
    parent,
    backgroundColor: `#${PALETTE.ink0.toString(16).padStart(6, '0')}`,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: CANVAS.width,
      height: CANVAS.height,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    // 씬은 아래에서 add()로 등록 — 그래야 init data 가 정확하게 전달됨
    render: {
      pixelArt: true,
      antialias: false,
      antialiasGL: false,
    },
    input: {
      activePointers: 2,
    },
    canvasStyle: 'display: block; image-rendering: pixelated;',
  };

  const game = new Phaser.Game(config);

  // 씬을 명시적으로 등록 + 데이터 주입 + autostart.
  // Phaser가 boot 전이면 큐잉되고, boot 후면 즉시 시작됨.
  game.scene.add('GameScene', GameScene, true, { sessionId, onGameOver });

  return {
    destroy: () => {
      game.destroy(true);
    },
  };
}
