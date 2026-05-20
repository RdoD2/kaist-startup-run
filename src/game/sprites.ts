// =====================================================================
// STARTUP RUN — 픽셀 스프라이트 컴포지트 (외부 이미지 없음, Rectangle/Graphics만)
// =====================================================================

import * as Phaser from 'phaser';
import { PALETTE } from '@/lib/constants';
import type { ObstacleType } from './obstacles';

// ─── 플레이어 스프라이트 타입 ────────────────────────────────────────────────

export type PlayerSprite = {
  container: Phaser.GameObjects.Container;
  legLeft: Phaser.GameObjects.Rectangle;
  legRight: Phaser.GameObjects.Rectangle;
  body: Phaser.GameObjects.Rectangle;
  head: Phaser.GameObjects.Rectangle;
};

// ─── 헬퍼: 씬에 Rectangle을 컨테이너 상대좌표로 추가 ──────────────────────

function addRect(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  rx: number,
  ry: number,
  w: number,
  h: number,
  color: number,
  alpha = 1,
): Phaser.GameObjects.Rectangle {
  const r = scene.add.rectangle(rx, ry, w, h, color, alpha);
  container.add(r);
  return r;
}

function addGfx(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  container.add(g);
  return g;
}

// ─── 플레이어: 후드티 청년 픽셀 컴포지트 ─────────────────────────────────────
// w = 22, h = 32 기준. 컨테이너 원점 = 중앙 하단(발바닥).
// 상대 Y는 위로 갈수록 음수.

export function createPlayerSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): PlayerSprite {
  const container = scene.add.container(x, y);

  // 비율 계산 (기본 22×32 기준)
  const scaleX = w / 22;
  const scaleY = h / 32;
  const u = (px: number) => Math.round(px * scaleX);
  const v = (px: number) => Math.round(px * scaleY);

  // ── 다리 (2개, run cycle용) ──────────────────────────────
  // 컨테이너 원점 = 중앙 하단
  const legW = u(6);
  const legH = v(10);
  // 컨테이너 원점이 중앙 하단이므로 다리 상단 y = -legH, 중심 y = -legH/2
  const legLeft = scene.add.rectangle(-u(3), -v(5), legW, legH, PALETTE.ink1);
  const legRight = scene.add.rectangle(u(3), -v(5), legW, legH, PALETTE.ink1);
  container.add([legLeft, legRight]);

  // ── 몸통 (후드티 — 약간 넓은 직사각형) ────────────────────
  const bodyW = u(14);
  const bodyH = v(14);
  const bodyY = -v(10) - bodyH / 2; // 다리 위
  const body = addRect(scene, container, 0, bodyY, bodyW, bodyH, PALETTE.ink1);

  // 후드티 앞주머니 (가로줄)
  addRect(scene, container, 0, bodyY + v(4), u(10), v(2), PALETTE.ink5);

  // ── 머리 ──────────────────────────────────────────────────
  const headW = u(12);
  const headH = v(10);
  const headY = bodyY - bodyH / 2 - headH / 2;
  const head = addRect(scene, container, 0, headY, headW, headH, PALETTE.ink15);

  // ── 후드 (머리 위 삼각형 느낌 — 2개 얇은 사각으로 표현) ──
  addRect(scene, container, -u(4), headY - v(1), u(4), v(3), PALETTE.ink1);
  addRect(scene, container, u(4), headY - v(1), u(4), v(3), PALETTE.ink1);
  addRect(scene, container, 0, headY - v(2), u(8), v(2), PALETTE.ink1);

  // ── 눈 (2px 점) ──────────────────────────────────────────
  addRect(scene, container, -u(2), headY - v(1), u(2), v(2), PALETTE.ink0);
  addRect(scene, container, u(2), headY - v(1), u(2), v(2), PALETTE.ink0);

  // ── 팔 (몸통 옆 얇은 막대) ───────────────────────────────
  addRect(scene, container, -u(9), bodyY, u(4), v(10), PALETTE.ink1);
  addRect(scene, container, u(9), bodyY, u(4), v(10), PALETTE.ink1);

  // 신발 (다리 아래 약간 더 넓게)
  addRect(scene, container, -u(3), -v(1), u(8), v(4), PALETTE.ink5);
  addRect(scene, container, u(3), -v(1), u(8), v(4), PALETTE.ink5);

  return { container, legLeft, legRight, body, head };
}

// ─── 장애물 스프라이트 ────────────────────────────────────────────────────────
// 컨테이너 원점 = 중앙 (x, y는 rect 중심과 동일).

export function createObstacleSprite(
  scene: Phaser.Scene,
  type: ObstacleType,
  x: number,
  y: number,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

  switch (type) {
    case 'investor_pass':
      drawInvestorPass(scene, container);
      break;
    case 'burnout':
      drawBurnout(scene, container);
      break;
    case 'cofounder_left':
      drawCofounder(scene, container);
      break;
    case 'competitor':
      drawCompetitor(scene, container);
      break;
    case 'lawsuit':
      drawLawsuit(scene, container);
      break;
    case 'pivot':
      drawPivot(scene, container);
      break;
    case 'rent_due':
      drawRentDue(scene, container);
      break;
    case 'tax_audit':
      drawTaxAudit(scene, container);
      break;
    case 'product_bug':
      drawProductBug(scene, container);
      break;
    case 'aws_bill':
      drawAwsBill(scene, container);
      break;
    case 'regulation':
      drawRegulation(scene, container);
      break;
    case 'office_drama':
      drawOfficeDrama(scene, container);
      break;
  }

  return container;
}

// ─── 개별 장애물 드로우 함수 ─────────────────────────────────────────────────

// investor_pass: 양복 사람 + 큰 X 마크
// def: 32×46
function drawInvestorPass(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 다리
  addRect(scene, c, -6, 16, 8, 16, PALETTE.ink1);
  addRect(scene, c, 6, 16, 8, 16, PALETTE.ink1);
  // 몸통 (양복 - 어두운 색)
  addRect(scene, c, 0, 2, 20, 20, PALETTE.ink1);
  // 와이셔츠 가운데 라인
  addRect(scene, c, 0, 2, 4, 16, PALETTE.ink7);
  // 머리
  addRect(scene, c, 0, -16, 12, 12, PALETTE.ink15);
  // X 마크 (두꺼운 선 2개)
  const g = addGfx(scene, c);
  g.lineStyle(4, PALETTE.ink8, 1);
  g.lineBetween(-10, -22, 10, -8);
  g.lineBetween(10, -22, -10, -8);
}

// burnout: 어두운 좀비 형태 + 눈 점 2개 + 처진 팔
// def: 38×52
function drawBurnout(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 다리 (휘어진 느낌 — 살짝 벌어진)
  addRect(scene, c, -8, 18, 8, 18, PALETTE.ink2);
  addRect(scene, c, 8, 18, 8, 18, PALETTE.ink2);
  // 발
  addRect(scene, c, -10, 26, 12, 6, PALETTE.ink5);
  addRect(scene, c, 10, 26, 12, 6, PALETTE.ink5);
  // 몸통 (어둡고 무거운)
  addRect(scene, c, 0, 0, 22, 20, PALETTE.ink2);
  // 어깨선 (더 어두운)
  addRect(scene, c, 0, -8, 24, 4, PALETTE.ink1);
  // 머리 (어둡고 큰)
  addRect(scene, c, 0, -18, 16, 14, PALETTE.ink2);
  // 눈 점 (2개) — PALETTE.ink10 노란 형광
  addRect(scene, c, -4, -19, 4, 4, PALETTE.ink10);
  addRect(scene, c, 4, -19, 4, 4, PALETTE.ink10);
  // 처진 팔 (길게 아래로)
  addRect(scene, c, -14, 6, 6, 20, PALETTE.ink2);
  addRect(scene, c, 14, 6, 6, 20, PALETTE.ink2);
}

// cofounder_left: 가방 든 사람 형체 (떠나는 방향 — 오른쪽)
// def: 50×64
function drawCofounder(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 다리
  addRect(scene, c, -8, 22, 10, 20, PALETTE.ink4);
  addRect(scene, c, 8, 22, 10, 20, PALETTE.ink4);
  // 몸통
  addRect(scene, c, 0, 2, 24, 24, PALETTE.ink4);
  // 가방 (오른쪽에 걸친 직사각형)
  addRect(scene, c, 18, 4, 12, 16, PALETTE.ink9);
  addRect(scene, c, 18, -2, 6, 4, PALETTE.ink9); // 가방 끈
  // 팔 (가방 든 쪽 오른팔 올라감)
  addRect(scene, c, -14, 2, 6, 18, PALETTE.ink4);
  addRect(scene, c, 14, -4, 6, 12, PALETTE.ink4);
  // 머리
  addRect(scene, c, 0, -20, 14, 14, PALETTE.ink15);
  // 화살표 방향 (오른쪽 — 떠나는 암시)
  const g = addGfx(scene, c);
  g.fillStyle(PALETTE.ink8, 1);
  g.fillTriangle(-6, -30, 6, -30, 0, -24);
}

// competitor: 화살 모양 (숙이기 장애물 — offsetY로 위에 떠있음)
// def: 56×22
function drawCompetitor(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 화살 꼬리 (직사각형)
  addRect(scene, c, -12, 0, 28, 10, PALETTE.ink12);
  // 화살 날개 (위아래 핀)
  addRect(scene, c, -12, -6, 8, 8, PALETTE.ink12);
  addRect(scene, c, -12, 6, 8, 8, PALETTE.ink12);
  // 화살 머리 (삼각형 — Graphics)
  const g = addGfx(scene, c);
  g.fillStyle(PALETTE.ink12, 1);
  g.fillTriangle(2, -10, 2, 10, 24, 0);
  // 강조 라인
  addRect(scene, c, -4, 0, 2, 6, PALETTE.ink7);
}

// lawsuit: 서류 (페이지 라인 줄무늬)
// def: 46×26 (duck — 위에 뜸)
function drawLawsuit(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 본체
  addRect(scene, c, 0, 0, 40, 22, PALETTE.ink9);
  // 접힌 모서리 (우상단 삼각 — 어두운 사각으로 표현)
  addRect(scene, c, 14, -7, 8, 8, PALETTE.ink5);
  // 줄무늬 (텍스트 라인 암시)
  for (let i = 0; i < 3; i++) {
    addRect(scene, c, -4, -6 + i * 6, 24, 2, PALETTE.ink5);
  }
  // 테두리 강조
  const g = addGfx(scene, c);
  g.lineStyle(2, PALETTE.ink5, 1);
  g.strokeRect(-20, -11, 40, 22);
}

// pivot: 표지판 (포스트 + 직사각형 판)
// def: 32×54
function drawPivot(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 포스트 (세로 막대)
  addRect(scene, c, 0, 16, 6, 32, PALETTE.ink5);
  // 판 (직사각형)
  addRect(scene, c, 0, -8, 28, 20, PALETTE.ink10);
  // 판 내부 화살표 (왼→오 방향 전환 암시 — 두 사각)
  addRect(scene, c, -6, -8, 8, 6, PALETTE.ink1);
  addRect(scene, c, 6, -8, 8, 6, PALETTE.ink1);
  // 판 테두리
  const g = addGfx(scene, c);
  g.lineStyle(2, PALETTE.ink1, 1);
  g.strokeRect(-14, -18, 28, 20);
}

// rent_due: 벽돌 (격자 패턴)
// def: 42×52
function drawRentDue(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 벽돌 배경
  addRect(scene, c, 0, 0, 40, 48, PALETTE.ink4);
  // 격자 (가로선 + 세로선 엇갈림 — 벽돌 패턴)
  const g = addGfx(scene, c);
  g.lineStyle(2, PALETTE.ink5, 0.8);
  // 가로선 4줄
  for (let i = -1; i <= 2; i++) {
    g.lineBetween(-20, i * 12 - 6, 20, i * 12 - 6);
  }
  // 세로선 엇갈림 (홀수/짝수 행 오프셋)
  for (let row = 0; row < 4; row++) {
    const offsetX = row % 2 === 0 ? 0 : 10;
    for (let col = -1; col <= 2; col++) {
      const xPos = col * 20 - 10 + offsetX;
      const yTop = row * 12 - 18;
      g.lineBetween(xPos, yTop, xPos, yTop + 12);
    }
  }
}

// tax_audit: 노트북 (직사각형 + 키 그리드)
// def: 42×24 (duck — 위에 뜸)
function drawTaxAudit(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 노트북 화면
  addRect(scene, c, 0, -4, 36, 12, PALETTE.ink1);
  addRect(scene, c, 0, -4, 32, 10, PALETTE.ink10);
  // 노트북 바닥 (키보드 부)
  addRect(scene, c, 0, 6, 40, 8, PALETTE.ink5);
  // 키 그리드 (작은 사각형 격자)
  const g = addGfx(scene, c);
  g.fillStyle(PALETTE.ink1, 1);
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 2; row++) {
      g.fillRect(-16 + col * 8, 3 + row * 4, 6, 3);
    }
  }
}

// product_bug: 작은 사각형 + 다리 4개 (벌레)
// def: 26×36
function drawProductBug(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 몸통 (타원형 암시 — 직사각 2개 겹침)
  addRect(scene, c, 0, 0, 16, 20, PALETTE.ink14);
  addRect(scene, c, 0, 0, 12, 24, PALETTE.ink14);
  // 머리
  addRect(scene, c, 0, -14, 10, 8, PALETTE.ink14);
  // 더듬이
  addRect(scene, c, -4, -20, 2, 8, PALETTE.ink5);
  addRect(scene, c, 4, -20, 2, 8, PALETTE.ink5);
  // 다리 3쌍 (좌우)
  const legYs = [-8, 0, 8];
  for (const ly of legYs) {
    addRect(scene, c, -12, ly, 10, 3, PALETTE.ink5);
    addRect(scene, c, 12, ly, 10, 3, PALETTE.ink5);
  }
  // 눈
  addRect(scene, c, -2, -14, 2, 2, PALETTE.ink0);
  addRect(scene, c, 2, -14, 2, 2, PALETTE.ink0);
}

// aws_bill: 직사각형 + 텍스트 대신 "$" 픽셀 패턴
// def: 52×22 (duck — 위에 뜸)
function drawAwsBill(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 본체 (청구서 느낌)
  addRect(scene, c, 0, 0, 48, 18, PALETTE.ink11);
  // 어두운 테두리
  const g = addGfx(scene, c);
  g.lineStyle(2, PALETTE.ink3, 1);
  g.strokeRect(-24, -9, 48, 18);
  // "$" 픽셀 패턴 (수직선 + 가로선 3개)
  g.fillStyle(PALETTE.ink1, 1);
  g.fillRect(-18, -6, 2, 12); // 세로선
  g.fillRect(-20, -6, 8, 2);  // 위 가로선
  g.fillRect(-20, -1, 8, 2);  // 중간 가로선
  g.fillRect(-20, 4, 8, 2);   // 아래 가로선
  // 숫자 3줄 (청구 금액 암시 — 직사각형 바)
  for (let i = 0; i < 3; i++) {
    addRect(scene, c, 8 + i * 6, 0, 4, 10, PALETTE.ink3);
  }
}

// regulation: 큰 건물 (창문 격자)
// def: 46×68
function drawRegulation(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 건물 본체
  addRect(scene, c, 0, 4, 42, 60, PALETTE.ink3);
  // 지붕
  addRect(scene, c, 0, -26, 46, 8, PALETTE.ink1);
  // 창문 격자 (3×4)
  const g = addGfx(scene, c);
  g.fillStyle(PALETTE.ink10, 0.9);
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 4; row++) {
      g.fillRect(-16 + col * 14, -16 + row * 14, 8, 8);
    }
  }
  // 문 (중앙 하단)
  addRect(scene, c, 0, 24, 10, 16, PALETTE.ink1);
}

// office_drama: 두 인물 마주봄
// def: 46×56
function drawOfficeDrama(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
): void {
  // 왼쪽 인물
  addRect(scene, c, -14, 16, 8, 16, PALETTE.ink13);  // 다리
  addRect(scene, c, -14, 0, 12, 16, PALETTE.ink13);   // 몸통
  addRect(scene, c, -14, -12, 10, 10, PALETTE.ink15); // 머리
  // 왼쪽 말풍선 (작은 사각)
  addRect(scene, c, -6, -20, 8, 6, PALETTE.ink7);
  addRect(scene, c, -10, -16, 2, 2, PALETTE.ink7); // 꼬리

  // 오른쪽 인물
  addRect(scene, c, 14, 16, 8, 16, PALETTE.ink2);    // 다리
  addRect(scene, c, 14, 0, 12, 16, PALETTE.ink2);     // 몸통
  addRect(scene, c, 14, -12, 10, 10, PALETTE.ink15);  // 머리
  // 오른쪽 말풍선
  addRect(scene, c, 6, -20, 8, 6, PALETTE.ink7);
  addRect(scene, c, 10, -16, 2, 2, PALETTE.ink7); // 꼬리

  // 중앙 긴장 표시 (번개/충돌 — 마주보는 화살표)
  const g = addGfx(scene, c);
  g.fillStyle(PALETTE.ink8, 1);
  g.fillRect(-2, 2, 4, 10); // 세로 선
  g.fillRect(-6, 2, 12, 2); // 가로 선
}
