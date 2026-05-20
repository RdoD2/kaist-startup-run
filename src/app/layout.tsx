import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'STARTUP RUN',
  description: 'KAIST 창업가의 N일을 버텨라',
  manifest: '/manifest.json',
  openGraph: {
    title: 'STARTUP RUN',
    description: 'KAIST 창업대회 미니게임 — 너는 며칠 버틸 수 있어?',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <div className="crt-overlay" />
        <div className="vignette" />
      </body>
    </html>
  );
}
