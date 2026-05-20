import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { requirePlayer } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const corsResult = handleCors(req);
  if (corsResult) return corsResult;

  if (req.method !== "POST") {
    return errorResponse("POST만 허용돼", 405);
  }

  // 인증
  const { player, response: authError } = await requirePlayer(req);
  if (authError) return authError;

  // 인증 완료 플레이어만 게임 시작 가능
  if (!player.is_verified) {
    return errorResponse(
      "회원가입 4단계를 완료해야 게임을 시작할 수 있어",
      403,
    );
  }

  const db = getServiceClient();
  const now = new Date().toISOString();

  // 기존 미사용 + 미만료 세션 있으면 재사용
  const { data: existing } = await db
    .from("game_sessions")
    .select("id, expires_at")
    .eq("player_id", player.id)
    .eq("consumed", false)
    .gt("expires_at", now)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return jsonResponse({
      game_session_id: existing.id,
      expires_at: existing.expires_at,
    });
  }

  // 새 세션 생성 (만료 10분)
  const { data: session, error } = await db
    .from("game_sessions")
    .insert({ player_id: player.id })
    .select("id, expires_at")
    .single();

  if (error || !session) {
    console.error("start-game insert error:", error);
    return errorResponse("게임 세션 생성 중 오류가 발생했어", 500);
  }

  return jsonResponse(
    { game_session_id: session.id, expires_at: session.expires_at },
    201,
  );
});
