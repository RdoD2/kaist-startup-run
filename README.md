# STARTUP RUN

KAIST 창업대회 홍보용 모바일 미니게임. Chrome dino + 창업 고난 테마. Toss 바이럴 결의 한 손 아케이드.

> **상태**: v1 코드 베이스. mock 모드로 전체 흐름 동작. 픽셀 스프라이트/사운드/Supabase 키 미완.

---

## Quickstart

```bash
npm install
npm run dev
# http://localhost:3000 에서 확인
```

게임만 격리 테스트: <http://localhost:3000/test-game> — 등록 우회 (배포 전 제거 가능).

---

## 환경변수

`.env.local` 파일을 프로젝트 루트에 생성. `.env.local.example` 참고.

| 키 | 필수 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ⛳ | Supabase 프로젝트 URL. 없으면 mock 모드. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⛳ | Supabase anon 키. |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 | Edge Function용. 클라이언트 노출 금지. |
| `SCORE_HMAC_SECRET` | 서버 | Anti-cheat HMAC 비밀키 (32바이트+ 랜덤). |
| `NEXT_PUBLIC_OFFICIAL_URL` | ⛳ | 대회 공식 홈페이지 URL (CTA 진입점). |

mock 모드 (env 없을 때):
- 모든 데이터는 `localStorage` 누적
- 게임 흐름 전체 가능 (등록 → 게임 → 사망 → 한 판 더)
- 리더보드는 빈 상태 표시

---

## 스크립트

| 명령 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 (포트 3000) |
| `npm run build` | 프로덕션 빌드 (정적 prerender) |
| `npm run start` | 빌드 결과 실행 |
| `npm run type-check` | TypeScript strict 검사 |
| `npm run lint` | ESLint |

---

## 폴더 구조

```
kaist-startup-run/
├── PRD.md                    살아있는 PRD (결정 락 시 업데이트)
├── AGENTS.md                 디자인 절대 룰 / 코드 룰
├── copy.md                   화면 카피, 사망원인 풀
├── privacy-policy.md         개인정보 처리방침 초안
├── schema.sql                Supabase 마이그레이션 원본
├── src/
│   ├── app/
│   │   ├── layout.tsx        루트 (폰트, CRT 오버레이, 비네팅)
│   │   ├── page.tsx          랜딩 (PrizeRain + START)
│   │   ├── register/         4-step 등록 폼
│   │   ├── play/             게임 + 사망 카드
│   │   ├── leaderboard/      데일리/전체 리더보드
│   │   └── test-game/        등록 우회 격리 테스트 (배포 전 제거 가능)
│   ├── components/
│   │   ├── ui/               PixelButton, PixelInput, PixelModal
│   │   ├── Registration/     StepShell + Step1~4
│   │   ├── Leaderboard/      LeaderboardView
│   │   ├── DeathCard/        점수 카드 + CTA
│   │   ├── PrizeRain/        랜딩 상품 쏟아짐 캔버스
│   │   └── GameCanvas.tsx    Phaser dynamic mount
│   ├── game/
│   │   ├── index.ts          Phaser.Game 부트
│   │   ├── GameScene.ts      메인 씬 (속도/장애물/충돌/HUD/사망)
│   │   ├── obstacles.ts      장애물 정의 + 패턴 풀
│   │   ├── powerups.ts       시드/멘토/엔젤
│   │   ├── boss.ts           데모데이 보스 상태머신
│   │   └── input.ts          탭/스와이프/키보드 핸들러
│   ├── hooks/
│   │   ├── usePlayer.ts      localStorage 캐시 + 인증 상태
│   │   └── useLeaderboard.ts Supabase view 조회 (env 없으면 mock)
│   └── lib/
│       ├── constants.ts      PALETTE, CANVAS, MECHANICS, PRIZES
│       ├── types.ts          공유 타입
│       ├── api.ts            Edge Function wrapper (mock fallback)
│       └── supabase.ts       클라/서비스 클라이언트
├── supabase/
│   ├── config.toml           로컬 dev 설정
│   ├── migrations/           DB 마이그레이션
│   └── functions/            5종 Edge Function
└── public/
    └── manifest.json         PWA manifest
```

---

## 디자인 절대 룰

전체 룰 + 코드 컨벤션은 [AGENTS.md](./AGENTS.md) 참조. 요약:

- 둥근 모서리 금지 (`border-radius: 0` globals.css에서 강제)
- 이모지 금지 (화살표/별/하트 모두 픽셀 도형으로)
- blur 그림자 금지 (`box-shadow: 2px 2px 0 0 #000` 같은 픽셀 그림자만)
- 그라데이션 금지 (CRT 스캔라인/비네팅만 예외, globals.css에 정의됨)
- AA 비활성 (`image-rendering: pixelated`)
- 한글: Galmuri11/9, 영문/숫자: Press Start 2P

---

## Supabase 배포

1. Supabase 프로젝트 생성: <https://app.supabase.com>
2. 마이그레이션 적용:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
3. Secrets 설정:
   ```bash
   supabase secrets set SCORE_HMAC_SECRET=$(openssl rand -hex 32)
   ```
4. Edge Functions 배포:
   ```bash
   supabase functions deploy register-player
   supabase functions deploy update-player
   supabase functions deploy start-game
   supabase functions deploy submit-score
   supabase functions deploy me
   ```

---

## Vercel 배포

1. `vercel link` 또는 GitHub 연동
2. 환경변수 5개 등록 (Production + Preview)
3. `vercel --prod`

PWA manifest 포함되어 있어 모바일에서 "홈 화면에 추가" 가능.

---

## /test-game 페이지

게임만 격리해서 동작 검증하는 개발용 페이지. 등록을 우회하고 바로 Phaser 게임을 마운트.

- 게임 종료 시 결과 (점수/사망원인/플레이 시간/마일스톤) 표시
- REPLAY 버튼으로 즉시 재시작
- **프로덕션 배포 전**: `src/app/test-game/` 폴더 삭제 권장

---

## 진행 상태

자세한 결정 사항과 미정 항목은 [PRD.md §11](./PRD.md)와 [PRD.md §12](./PRD.md) 참조.

남은 작업:
- 픽셀 스프라이트 8-12개 (현재 placeholder 색사각형)
- BGM/SFX 셀렉 (OpenGameArt CC0)
- 학과 마스터 리스트 (현재 임시 15개)
- 대회 주최 측 컨펌: 창업원 명칭 / 공식홈 URL / 책임자 / 약관 검토
- 공유 og:image 자동 생성

---

## 라이선스

내부 캠페인 용도. 외부 배포 시 협의 필요.
