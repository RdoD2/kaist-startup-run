import { makeHelpers } from "../_shared/cors.ts";
import { requirePlayer } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  const { handleCors, jsonResponse, errorResponse } = makeHelpers(req);
  const corsResult = handleCors();
  if (corsResult) return corsResult;

  if (req.method !== "GET") {
    return errorResponse("GET만 허용돼", 405);
  }

  // 인증
  const { player, response: authError } = await requirePlayer(req);
  if (authError) return authError;

  const db = getServiceClient();

  // 전체 랭킹
  const { data: allTimeRow } = await db
    .from("all_time_leaderboard")
    .select("rank")
    .eq("id", player.id)
    .maybeSingle();

  // 데일리 랭킹
  const { data: dailyRow } = await db
    .from("daily_leaderboard")
    .select("rank")
    .eq("id", player.id)
    .maybeSingle();

  // 응모권 = best_score (PRD §6)
  const tickets = player.best_score;

  return jsonResponse({
    player,
    current_rank_daily: dailyRow?.rank ?? null,
    current_rank_all: allTimeRow?.rank ?? null,
    tickets,
  });
});
