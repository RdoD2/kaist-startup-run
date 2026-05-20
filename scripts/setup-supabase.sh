#!/usr/bin/env bash
# =====================================================================
# STARTUP RUN — Supabase 자동 설정 스크립트
# Usage:
#   1. Supabase 대시보드에서 프로젝트 만들고 ref + keys 복사
#   2. .env.local 채우기 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
#   3. supabase login (interactive, 한 번만)
#   4. ./scripts/setup-supabase.sh <PROJECT_REF>
#       또는 SUPABASE_PROJECT_REF 환경변수 설정
# =====================================================================
set -euo pipefail

# 프로젝트 ref 입력 받기
PROJECT_REF="${1:-${SUPABASE_PROJECT_REF:-}}"
if [ -z "$PROJECT_REF" ]; then
  echo "❌ PROJECT_REF 필요"
  echo "사용법: ./scripts/setup-supabase.sh <PROJECT_REF>"
  echo "  또는: SUPABASE_PROJECT_REF=xxxx ./scripts/setup-supabase.sh"
  echo ""
  echo "PROJECT_REF는 https://app.supabase.com 대시보드 URL에서 확인:"
  echo "  https://app.supabase.com/project/<PROJECT_REF>"
  exit 1
fi

# Supabase CLI 확인
if ! command -v supabase >/dev/null 2>&1; then
  echo "❌ supabase CLI 미설치"
  echo "설치: brew install supabase/tap/supabase"
  exit 1
fi

# Login 상태 확인
if ! supabase projects list >/dev/null 2>&1; then
  echo "❌ supabase login 필요"
  echo "실행: supabase login"
  exit 1
fi

echo "==> 프로젝트 링크: $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "==> 마이그레이션 적용 (supabase/migrations/)"
supabase db push

echo ""
echo "==> Secrets 설정 (SCORE_HMAC_SECRET)"
HMAC_SECRET="$(openssl rand -hex 32)"
supabase secrets set "SCORE_HMAC_SECRET=$HMAC_SECRET"

echo ""
echo "==> Edge Functions 배포 (5종)"
for fn in register-player update-player start-game submit-score me; do
  echo "  → $fn"
  supabase functions deploy "$fn" --no-verify-jwt
done

echo ""
echo "✅ Supabase 셋업 완료"
echo ""
echo "Next:"
echo "  1. .env.local에 NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY 박혀있는지 확인"
echo "  2. npm run dev → mock 모드 해제, 진짜 Supabase 호출됨"
echo "  3. 배포: vercel --prod (env 5개 미리 등록 필요)"
