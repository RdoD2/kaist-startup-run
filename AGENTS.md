# STARTUP RUN — Agent 작업 룰

작업 전 반드시 읽을 것:
- `PRD.md` — 게임 규칙, 메커닉 캘리브레이션, 디자인 룰
- `schema.sql` — DB 스키마 (Supabase)
- `copy.md` — 화면 카피, 사망원인 풀, 카피 톤
- `src/lib/constants.ts` — 메커닉 수치 (속도/점수/마일스톤 등)
- `src/lib/types.ts` — 공유 타입

## 디자인 절대 룰 (어김없이)

- **둥근 모서리 금지** (`border-radius: 0`, globals.css에서 강제됨)
- **이모지 금지** — 화살표/하트/별 모두 픽셀 도형/문자로
- **blur 그림자 금지** — `box-shadow: 2px 2px 0 0 #000` 같은 픽셀 그림자만
- **그라데이션 금지** — dither 패턴 또는 단색만
- **AA 비활성** — `image-rendering: pixelated`, `-webkit-font-smoothing: none`
- 한글: Galmuri11/9, 영문/숫자: Press Start 2P
- 색상: `theme.colors.ink.*` (Pico-8 16색) + `theme.colors.kaist`
- 픽셀 단위: 모든 spacing은 4px 배수, 폰트 크기 8/10/12/16/20/24 권장

## 코드 룰

- TypeScript strict
- Next.js App Router (`src/app/...`)
- 클라이언트 컴포넌트는 `'use client'` 최상단
- 상수는 무조건 `src/lib/constants.ts` 참조 (하드코딩 금지)
- 타입은 `src/lib/types.ts` 또는 모듈 로컬에서 가져오기
- Supabase 직접 호출은 brower client는 view SELECT만, 쓰기는 모두 Edge Function 통해
- 주석은 한글 OK, 카피와 분리

## 자산 약속

- 픽셀 스프라이트는 **아직 없음**. 임시로 색상 사각형 / 텍스트 라벨로 대체.
- 자산 들어갈 자리에 `// TODO: replace with pixel sprite` 마커 필수.
- BGM/SFX 비슷하게 placeholder, `// TODO: replace with chiptune` 마커.

## 환경변수

`.env.local.example` 참고. 미입력 상태에서도 빌드는 통과해야 함 (런타임 에러 OK, 빌드 에러 X).

## 디렉터리 오너십

| 경로 | 담당 |
|---|---|
| `src/game/*` | Game (Phaser scene) |
| `src/app/*`, `src/components/*` | UI (Next.js + React) |
| `supabase/functions/*` | Backend (Edge Functions) |
| `src/lib/*` | 공유 (수정 시 모든 담당과 영향 체크) |

여러 담당이 같은 파일 건드려야 하면 conflict 없게 PRD 흐름 그대로 따라갈 것.

## 빌드 검증

- `npm run type-check` 통과
- `npm run build` 통과
- (개발 환경) `npm run dev` 후 `localhost:3000` 에서 랜딩 페이지 진입 확인
