import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const DEATH_LABEL: Record<string, string> = {
  investor_pass: '투자자 거절에 의해 망했습니다',
  burnout: '번아웃에 의해 망했습니다',
  cofounder_left: '코파운더 이탈에 의해 망했습니다',
  competitor: '경쟁사에 의해 망했습니다',
  lawsuit: '법무 이슈에 의해 망했습니다',
  pivot_fail: '피봇 실패에 의해 망했습니다',
  demo_day: '데모데이에서 망했습니다',
  cash_dry: '런웨이 고갈에 의해 망했습니다',
  regulation: '규제에 의해 망했습니다',
  product_fail: '프로덕트 장애에 의해 망했습니다',
};

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const score = searchParams.get('score') ?? '0';
  const cause = searchParams.get('cause') ?? 'burnout';
  const nickname = searchParams.get('nickname') ?? '익명창업가';
  const tickets = parseInt(searchParams.get('tickets') ?? '0', 10);

  const causeLabel = DEATH_LABEL[cause] ?? '알 수 없는 이유로 망했습니다';

  // Press Start 2P TTF (vercel/og는 WOFF2 미지원, TTF/OTF/WOFF만 가능)
  let fontBuffer: ArrayBuffer | null = null;
  try {
    const fontRes = await fetch(
      'https://github.com/google/fonts/raw/main/ofl/pressstart2p/PressStart2P-Regular.ttf',
    );
    if (fontRes.ok) {
      const buf = await fontRes.arrayBuffer();
      // 매직 바이트 검증: TTF는 0x00010000, OTF는 'OTTO'
      const view = new DataView(buf);
      const magic = view.getUint32(0, false);
      if (magic === 0x00010000 || magic === 0x4f54544f) {
        fontBuffer = buf;
      }
    }
  } catch {
    // fallback: monospace
  }

  const fontConfig = fontBuffer
    ? [{ name: 'PressStart2P', data: fontBuffer, style: 'normal' as const }]
    : [];

  const pixelFont = fontBuffer ? 'PressStart2P, monospace' : 'monospace';

  // Pixel character colors
  const C_CREAM = '#fff1e8';
  const C_HOOD = '#1d2b53';
  const C_SHADOW = '#003875';
  const C_SKIN = '#ffccaa';
  const C_SHOE = '#29adff';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#000000',
          display: 'flex',
          flexDirection: 'row',
          fontFamily: pixelFont,
          position: 'relative',
          border: '8px solid #fff1e8',
          overflow: 'hidden',
        }}
      >
        {/* KAIST blue accent bar top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '8px',
            background: '#003875',
            display: 'flex',
          }}
        />
        {/* KAIST blue accent bar bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '8px',
            background: '#003875',
            display: 'flex',
          }}
        />

        {/* ── LEFT 40%: pixel character ── */}
        <div
          style={{
            width: '40%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Character container — absolute positioned pixel art */}
          <div style={{ position: 'relative', width: '160px', height: '240px', display: 'flex' }}>
            {/* Head */}
            <div
              style={{
                position: 'absolute',
                top: '0px',
                left: '32px',
                width: '96px',
                height: '80px',
                background: C_SKIN,
                display: 'flex',
              }}
            />
            {/* Hood top */}
            <div
              style={{
                position: 'absolute',
                top: '0px',
                left: '16px',
                width: '128px',
                height: '40px',
                background: C_HOOD,
                display: 'flex',
              }}
            />
            {/* Hood sides left */}
            <div
              style={{
                position: 'absolute',
                top: '0px',
                left: '16px',
                width: '32px',
                height: '96px',
                background: C_HOOD,
                display: 'flex',
              }}
            />
            {/* Hood sides right */}
            <div
              style={{
                position: 'absolute',
                top: '0px',
                left: '112px',
                width: '32px',
                height: '96px',
                background: C_HOOD,
                display: 'flex',
              }}
            />
            {/* Eye left */}
            <div
              style={{
                position: 'absolute',
                top: '48px',
                left: '52px',
                width: '16px',
                height: '16px',
                background: '#000',
                display: 'flex',
              }}
            />
            {/* Eye right */}
            <div
              style={{
                position: 'absolute',
                top: '48px',
                left: '92px',
                width: '16px',
                height: '16px',
                background: '#000',
                display: 'flex',
              }}
            />
            {/* Body */}
            <div
              style={{
                position: 'absolute',
                top: '80px',
                left: '24px',
                width: '112px',
                height: '96px',
                background: C_HOOD,
                display: 'flex',
              }}
            />
            {/* Body shadow */}
            <div
              style={{
                position: 'absolute',
                top: '80px',
                left: '128px',
                width: '8px',
                height: '96px',
                background: C_SHADOW,
                display: 'flex',
              }}
            />
            {/* Arm left */}
            <div
              style={{
                position: 'absolute',
                top: '88px',
                left: '0px',
                width: '24px',
                height: '72px',
                background: C_HOOD,
                display: 'flex',
              }}
            />
            {/* Arm right */}
            <div
              style={{
                position: 'absolute',
                top: '88px',
                left: '136px',
                width: '24px',
                height: '72px',
                background: C_HOOD,
                display: 'flex',
              }}
            />
            {/* Leg left */}
            <div
              style={{
                position: 'absolute',
                top: '176px',
                left: '32px',
                width: '40px',
                height: '48px',
                background: C_CREAM,
                display: 'flex',
              }}
            />
            {/* Leg right */}
            <div
              style={{
                position: 'absolute',
                top: '176px',
                left: '88px',
                width: '40px',
                height: '48px',
                background: C_CREAM,
                display: 'flex',
              }}
            />
            {/* Shoe left */}
            <div
              style={{
                position: 'absolute',
                top: '216px',
                left: '24px',
                width: '48px',
                height: '24px',
                background: C_SHOE,
                display: 'flex',
              }}
            />
            {/* Shoe right */}
            <div
              style={{
                position: 'absolute',
                top: '216px',
                left: '88px',
                width: '48px',
                height: '24px',
                background: C_SHOE,
                display: 'flex',
              }}
            />
          </div>
        </div>

        {/* ── RIGHT 60%: info panel ── */}
        <div
          style={{
            width: '60%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingRight: '48px',
            paddingTop: '24px',
            paddingBottom: '24px',
            gap: '20px',
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontSize: '22px',
              color: '#003875',
              letterSpacing: '6px',
              textShadow: '3px 3px 0 #fff1e8',
              display: 'flex',
            }}
          >
            STARTUP RUN
          </div>

          {/* GAME OVER */}
          <div
            style={{
              fontSize: '52px',
              color: '#ff004d',
              letterSpacing: '4px',
              textShadow: '4px 4px 0 #7e2553',
              display: 'flex',
            }}
          >
            GAME OVER
          </div>

          {/* Score box */}
          <div
            style={{
              border: '4px solid #fff1e8',
              padding: '20px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#1d2b53',
              boxShadow: '6px 6px 0 #003875',
            }}
          >
            {/* Nickname */}
            <div
              style={{
                fontSize: '18px',
                color: '#c2c3c7',
                letterSpacing: '2px',
                display: 'flex',
              }}
            >
              {nickname}
            </div>
            {/* Score */}
            <div
              style={{
                fontSize: '44px',
                color: '#ffec27',
                letterSpacing: '2px',
                textShadow: '4px 4px 0 #ab5236',
                display: 'flex',
              }}
            >
              창업 {score}일차
            </div>
            {/* Cause */}
            <div
              style={{
                fontSize: '18px',
                color: '#fff1e8',
                letterSpacing: '1px',
                display: 'flex',
              }}
            >
              {causeLabel}
            </div>
            {/* Tickets */}
            <div
              style={{
                fontSize: '16px',
                color: '#29adff',
                letterSpacing: '1px',
                display: 'flex',
              }}
            >
              응모권 {tickets}장 획득
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              fontSize: '14px',
              color: '#5f574f',
              letterSpacing: '2px',
              display: 'flex',
            }}
          >
            STARTUP RUN · KAIST 창업대회 응모 · kaist-startup-run.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontConfig,
    }
  );
}
