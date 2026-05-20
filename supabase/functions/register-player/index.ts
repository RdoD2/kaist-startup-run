import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

// 닉네임: 1~12자, 한글/영문/숫자만 허용
const NICKNAME_RE = /^[가-힣a-zA-Z0-9]{1,12}$/;

Deno.serve(async (req: Request) => {
  const corsResult = handleCors(req);
  if (corsResult) return corsResult;

  if (req.method !== "POST") {
    return errorResponse("POST만 허용돼", 405);
  }

  let body: { nickname?: unknown };
  try {
    body = await req.json();
  } catch {
    return errorResponse("JSON 파싱 실패", 400);
  }

  const nickname = body.nickname;
  if (typeof nickname !== "string" || !NICKNAME_RE.test(nickname)) {
    return errorResponse(
      "닉네임은 1~12자 한글/영문/숫자만 가능해",
      400,
    );
  }

  const db = getServiceClient();

  // 닉네임 중복 체크
  const { data: existing } = await db
    .from("players")
    .select("id")
    .eq("nickname", nickname)
    .maybeSingle();

  if (existing) {
    return errorResponse("이미 사용 중인 닉네임이야", 409);
  }

  // 새 anon_token (UUID v4) 생성
  const anonToken = crypto.randomUUID();

  const { data: player, error } = await db
    .from("players")
    .insert({
      nickname,
      anon_token: anonToken,
      registration_step: 1,
    })
    .select("id, anon_token")
    .single();

  if (error || !player) {
    console.error("register-player insert error:", error);
    return errorResponse("플레이어 등록 중 오류가 발생했어", 500);
  }

  return jsonResponse(
    { player_id: player.id, anon_token: player.anon_token },
    201,
  );
});
