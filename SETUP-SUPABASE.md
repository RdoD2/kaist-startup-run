# Supabase 셋업 가이드

> Supabase 프로젝트 생성부터 Edge Functions 배포까지. 한 번만 하면 됨.

---

## 사전 준비

```bash
# Supabase CLI 설치 (한 번만)
brew install supabase/tap/supabase

# 로그인 (브라우저 열림)
supabase login
```

---

## 1. Supabase 프로젝트 생성

1. <https://app.supabase.com> 접속
2. **New Project** 클릭
3. Org / Name / DB Password / Region (Northeast Asia (Seoul) ap-northeast-2 권장) 입력
4. 프로젝트 생성 (~2분)

---

## 2. 키 복사 → `.env.local`

`.env.local.example`을 복사:

```bash
cp .env.local.example .env.local
```

대시보드에서 **Settings → API** 페이지 열고 복사해서 채움:

| 키 | 위치 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Project API keys → `service_role` `secret` |
| `NEXT_PUBLIC_OFFICIAL_URL` | 대회 공식 홈페이지 (확정 시) |

`SCORE_HMAC_SECRET`는 자동 생성되니까 비워둬도 됨.

---

## 3. 자동 설정 스크립트 실행

대시보드 URL의 ref 부분 복사:
`https://app.supabase.com/project/<여기>`

```bash
# PROJECT_REF 인자로 한 번에
npm run supabase:setup -- <PROJECT_REF>

# 또는 env로
SUPABASE_PROJECT_REF=xxxx npm run supabase:setup
```

스크립트가 자동 실행:
- `supabase link --project-ref <REF>` (프로젝트 연결)
- `supabase db push` (마이그레이션 5개 테이블 + 뷰 + RLS)
- `supabase secrets set SCORE_HMAC_SECRET=<랜덤32바이트>`
- `supabase functions deploy register-player / update-player / start-game / submit-score / me` (5종)

---

## 4. 개별 명령 (선택)

```bash
# 마이그레이션만 다시 적용
npm run supabase:push

# Edge Functions만 재배포
npm run supabase:functions

# HMAC secret 재생성
npm run supabase:secrets
```

---

## 5. 로컬에서 확인

```bash
npm run dev
```

- `http://localhost:3000` 접속 후 등록 + 게임 플레이
- 점수 제출이 진짜 Supabase에 저장됨
- 대시보드 **Table Editor**에서 `players` / `scores` 테이블 확인

mock 모드가 비활성화되려면 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` 둘 다 채워져야 함.

---

## Vercel 배포

1. <https://vercel.com> 프로젝트 생성 + GitHub 연결
2. Settings → Environment Variables에 5개 등록:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SCORE_HMAC_SECRET`
   - `NEXT_PUBLIC_OFFICIAL_URL`
3. Production + Preview 둘 다 적용
4. `vercel --prod` 또는 main 푸시

---

## 대회 마감일 설정 (D-day 카운터)

랜딩 페이지 우상단 D-day 카운터 날짜를 변경하는 방법:

- **코드 직접 수정**: `src/lib/constants.ts`의 `CAMPAIGN_DEADLINE` 값 교체
- **환경변수 (권장)**: `.env.local`에 `NEXT_PUBLIC_CAMPAIGN_DEADLINE` 설정
  ```
  NEXT_PUBLIC_CAMPAIGN_DEADLINE=2026-08-15T23:59:59+09:00
  ```
- ISO 8601 형식 + `+09:00` KST timezone 권장

---

## 트러블슈팅

**"이미 등록된 학번이야"** — 학번 unique 제약 위반. 동일 학번 중복 등록 차단됨.

**점수 제출이 비정상이야** — 서버 anti-cheat 검증 실패. 콘솔 로그 확인.
- `duration_ms >= 5000` 필요 (최소 5초)
- `score / (duration_ms/1000) <= 100` (속도/점수 비율 캡)

**Edge Function 500** — `supabase functions logs <fn-name>` 으로 확인. `SCORE_HMAC_SECRET` 누락이 흔한 원인.

**CORS** — 현재 `*` 허용. 도메인 확정되면 `supabase/functions/_shared/cors.ts`에서 좁힐 것.
