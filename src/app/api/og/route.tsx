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

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: pixelFont,
          position: 'relative',
          border: '8px solid #fff1e8',
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

        {/* Logo */}
        <div
          style={{
            fontSize: '28px',
            color: '#003875',
            letterSpacing: '6px',
            marginBottom: '32px',
            textShadow: '3px 3px 0 #fff1e8',
            display: 'flex',
          }}
        >
          STARTUP RUN
        </div>

        {/* GAME OVER header */}
        <div
          style={{
            fontSize: '48px',
            color: '#ff004d',
            letterSpacing: '4px',
            marginBottom: '40px',
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
            padding: '24px 48px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            background: '#1d2b53',
            boxShadow: '6px 6px 0 #003875',
          }}
        >
          <div
            style={{
              fontSize: '20px',
              color: '#c2c3c7',
              letterSpacing: '2px',
              display: 'flex',
            }}
          >
            {nickname}
          </div>
          <div
            style={{
              fontSize: '52px',
              color: '#ffec27',
              letterSpacing: '2px',
              textShadow: '4px 4px 0 #ab5236',
              display: 'flex',
            }}
          >
            창업 {score}일차
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#fff1e8',
              letterSpacing: '1px',
              display: 'flex',
            }}
          >
            {causeLabel}
          </div>
        </div>

        {/* Footer CTA */}
        <div
          style={{
            fontSize: '18px',
            color: '#5f574f',
            letterSpacing: '2px',
            marginTop: '16px',
            display: 'flex',
          }}
        >
          KAIST 창업대회 · kaist-startup-run.vercel.app
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
