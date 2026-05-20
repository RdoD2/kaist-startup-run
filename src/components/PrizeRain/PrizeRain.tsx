'use client';
// =====================================================================
// PrizeRain — 상품 아이콘이 위에서 후두둑 떨어지는 캔버스 애니메이션
// 픽셀 도형으로 표현:
//   맥미니   = ink6 사각형
//   치킨(베스타) = ink9 원 + ink4 꼭지
//   마사지기  = ink13 둥근 직사각형 (1px 직각으로)
//   배민봉투  = ink10 봉투
// 탭하면 상품 정보 모달
// =====================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PRIZES } from '../../lib/constants';
import { PixelModal } from '../ui/PixelModal';

// Pico-8 팔레트 CSS hex
const COLOR = {
  ink4: '#AB5236',
  ink6: '#C2C3C7',
  ink9: '#FFA300',
  ink10: '#FFEC27',
  ink13: '#83769C',
  ink7: '#FFF1E8',
  ink0: '#000000',
  ink8: '#FF004D',
  kaist: '#003875',
};

type PrizeType = 'mac-mini' | 'vesta' | 'pulio' | 'baemin';

type Particle = {
  x: number;
  y: number;
  vy: number;       // 수직 속도
  vx: number;       // 약간 흔들림
  type: PrizeType;
  size: number;
  rotation: number;
  rotSpeed: number;
  landed: boolean;
  landY: number;
};

const PRIZE_TYPES: PrizeType[] = ['mac-mini', 'vesta', 'pulio', 'baemin'];

function randomPrizeType(): PrizeType {
  return PRIZE_TYPES[Math.floor(Math.random() * PRIZE_TYPES.length)];
}

// ─── 픽셀 도형 드로잉 함수들 ──────────────────────────────────────

function drawMacMini(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // TODO: replace with pixel sprite
  const w = size * 1.4;
  const h = size * 0.7;
  ctx.fillStyle = COLOR.ink6;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  // 테두리
  ctx.strokeStyle = COLOR.ink0;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  // 전원 버튼 도트
  ctx.fillStyle = COLOR.ink0;
  ctx.fillRect(x + w / 2 - 4, y - 2, 2, 4);
}

function drawVesta(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // TODO: replace with pixel sprite — 치킨 박스 (베스타 식사권 대표)
  const r = size / 2;
  // 박스 몸통
  ctx.fillStyle = COLOR.ink9;
  ctx.fillRect(x - r, y - r * 0.6, r * 2, r * 1.2);
  // 뚜껑
  ctx.fillStyle = COLOR.ink4;
  ctx.fillRect(x - r, y - r * 1.0, r * 2, r * 0.5);
  // 테두리
  ctx.strokeStyle = COLOR.ink0;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - r, y - r * 1.0, r * 2, r * 1.7);
}

function drawPulio(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // TODO: replace with pixel sprite — 마사지기 (직사각형 + 버튼들)
  const w = size * 0.8;
  const h = size * 1.6;
  ctx.fillStyle = COLOR.ink13;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  // 버튼 도트들
  ctx.fillStyle = COLOR.ink7;
  ctx.fillRect(x - 2, y - h / 4, 4, 3);
  ctx.fillRect(x - 2, y + h / 4 - 3, 4, 3);
  // 테두리
  ctx.strokeStyle = COLOR.ink0;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
}

function drawBaemin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // TODO: replace with pixel sprite — 배민 봉투
  const w = size * 1.2;
  const h = size * 1.0;
  // 봉투 몸통
  ctx.fillStyle = COLOR.ink10;
  ctx.fillRect(x - w / 2, y - h / 4, w, h * 0.75);
  // 봉투 상단 플랩
  ctx.fillStyle = COLOR.ink10;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 4);
  ctx.lineTo(x, y + h / 6);
  ctx.lineTo(x + w / 2, y - h / 4);
  ctx.closePath();
  ctx.fill();
  // 상단 삼각형 (접힌 부분)
  ctx.fillStyle = COLOR.ink4;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 4);
  ctx.lineTo(x, y - h / 2);
  ctx.lineTo(x + w / 2, y - h / 4);
  ctx.closePath();
  ctx.fill();
  // 테두리
  ctx.strokeStyle = COLOR.ink0;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2, y - h / 4, w, h * 0.75);
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  switch (p.type) {
    case 'mac-mini': drawMacMini(ctx, 0, 0, p.size); break;
    case 'vesta': drawVesta(ctx, 0, 0, p.size); break;
    case 'pulio': drawPulio(ctx, 0, 0, p.size); break;
    case 'baemin': drawBaemin(ctx, 0, 0, p.size); break;
  }
  ctx.restore();
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────

type SelectedPrize = (typeof PRIZES)[number] | null;

export function PrizeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  const [selectedPrize, setSelectedPrize] = useState<SelectedPrize>(null);

  const spawnParticle = useCallback((canvasWidth: number) => {
    const size = 12 + Math.random() * 8;
    const x = Math.random() * canvasWidth;
    particlesRef.current.push({
      x,
      y: -size * 2,
      vy: 60 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 20,
      type: randomPrizeType(),
      size,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2,
      landed: false,
      landY: 0,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 = 부모에 맞춤
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 초기 파티클 burst
    for (let i = 0; i < 8; i++) {
      const p = {
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vy: 60 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 20,
        type: randomPrizeType(),
        size: 12 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2,
        landed: false,
        landY: 0,
      };
      particlesRef.current.push(p);
    }

    const tick = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;
      spawnTimerRef.current += dt;

      // 일정 간격으로 새 파티클 생성
      if (spawnTimerRef.current > 0.8) {
        spawnParticle(canvas.width);
        spawnTimerRef.current = 0;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        if (!p.landed) {
          p.vy += 120 * dt; // 중력
          p.y += p.vy * dt;
          p.x += p.vx * dt;
          p.rotation += p.rotSpeed * dt;

          // 착지
          const groundY = canvas.height - p.size;
          if (p.y >= groundY) {
            p.y = groundY;
            p.vy = 0;
            p.vx = 0;
            p.rotSpeed = 0;
            p.landed = true;
            p.landY = p.y;
          }
        }
        drawParticle(ctx, p);
      }

      // 너무 많이 쌓이면 오래된 것 제거 (최대 30개)
      if (particlesRef.current.length > 30) {
        particlesRef.current.splice(0, particlesRef.current.length - 30);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      particlesRef.current = [];
    };
  }, [spawnParticle]);

  // 탭 → 가장 가까운 파티클 찾아 상품 정보 모달
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const tx = e.clientX - rect.left;
      const ty = e.clientY - rect.top;

      let closest: Particle | null = null;
      let minDist = Infinity;
      for (const p of particlesRef.current) {
        const d = Math.hypot(p.x - tx, p.y - ty);
        if (d < minDist && d < 40) {
          minDist = d;
          closest = p;
        }
      }
      if (closest) {
        const prize = PRIZES.find((pr) => pr.id === closest!.type) ?? null;
        setSelectedPrize(prize);
      }
    },
    [],
  );

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onClick={handleClick}
        aria-hidden="true"
      />

      {/* 상품 정보 모달 */}
      <PixelModal
        open={!!selectedPrize}
        onClose={() => setSelectedPrize(null)}
        title="PRIZE INFO"
      >
        {selectedPrize && (
          <div className="flex flex-col gap-4 py-4">
            <p className="font-kor text-[24px] text-ink-10">{selectedPrize.label}</p>
            <p className="font-kor text-[18px] text-ink-6">
              수량: {selectedPrize.qty}개
            </p>
            <p className="font-kor text-[18px] text-ink-5 leading-relaxed">
              점수 = 응모권. 더 많이 버틸수록 당첨 확률이 올라가.
              <br />
              지금 바로 플레이해서 응모권 모아봐.
            </p>
          </div>
        )}
      </PixelModal>
    </>
  );
}
