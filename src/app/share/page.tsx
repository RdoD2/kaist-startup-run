import type { Metadata } from 'next';

// =====================================================================
// 공유 랜딩 — /share?score=..&cause=..&nickname=..&tickets=..
// 카카오톡/SNS에 공유되는 링크. generateMetadata로 점수별 OG 이미지를
// 미리보기로 걸고, 사용자가 탭하면 게임 진입점으로 유도한다.
// =====================================================================

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://kaist-startup-run.vercel.app';

type SP = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(v)) return v[0] ?? fallback;
  return v ?? fallback;
}

function buildOgUrl(sp: SP): string {
  const score = first(sp.score, '0');
  const cause = first(sp.cause, 'burnout');
  const nickname = first(sp.nickname, '익명창업가');
  const tickets = first(sp.tickets, '0');
  return `${BASE_URL}/api/og?score=${encodeURIComponent(score)}&cause=${encodeURIComponent(
    cause,
  )}&nickname=${encodeURIComponent(nickname)}&tickets=${encodeURIComponent(tickets)}`;
}

export function generateMetadata({ searchParams }: { searchParams: SP }): Metadata {
  const score = first(searchParams.score, '0');
  const nickname = first(searchParams.nickname, '익명창업가');
  const ogUrl = buildOgUrl(searchParams);
  const title = `${nickname}님은 ${score}일 버텼다`;
  return {
    title: `${title} — STARTUP RUN`,
    description: 'KAIST 창업대회 미니게임 — 너는 며칠 버틸 수 있어?',
    openGraph: {
      title,
      description: '너는 며칠 버틸 수 있어? · STARTUP RUN · KAIST 창업대회',
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      images: [ogUrl],
    },
  };
}

export default function SharePage({ searchParams }: { searchParams: SP }) {
  const score = first(searchParams.score, '0');
  const nickname = first(searchParams.nickname, '익명창업가');
  const tickets = first(searchParams.tickets, '0');
  const ogUrl = buildOgUrl(searchParams);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-ink-0 max-w-[360px] mx-auto px-4 py-8 gap-6 text-center">
      <p className="font-pixel text-[20px] text-ink-8 tracking-widest">STARTUP RUN</p>

      {/* 점수 결과 이미지 미리보기 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ogUrl}
        alt={`${nickname}님의 결과`}
        className="w-full border-2 border-ink-8"
      />

      <div className="flex flex-col gap-1">
        <p className="text-ink-8 text-[15px]">
          <strong>{nickname}</strong>님은 <strong>{score}일</strong> 버텼다
        </p>
        <p className="text-ink-8/60 text-[13px]">응모권 {tickets}장 획득</p>
      </div>

      <a
        href="/"
        className="w-full border-2 border-ink-8 bg-ink-8 text-ink-0 font-pixel text-[16px] py-3 tracking-widest"
      >
        나도 도전하기 →
      </a>
      <p className="text-ink-8/50 text-[12px]">KAIST 창업대회 · 너는 며칠 버틸 수 있어?</p>
    </div>
  );
}
