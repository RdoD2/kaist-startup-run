import { makeHelpers } from "../_shared/cors.ts";
import { requirePlayer } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";

// PRD §3: 사망원인 enum
const VALID_DEATH_CAUSES = new Set([
  "investor_pass",
  "burnout",
  "cofounder_left",
  "competitor",
  "lawsuit",
  "pivot_fail",
  "demo_day",
  "cash_dry",
  "regulation",
  "product_fail",
]);

// PRD §3: 마일스톤 점수 기준
const MILESTONE_THRESHOLDS: Array<[number, string]> = [
  [100, "100"],
  [365, "365"],
  [1000, "1000"],
];

// PRD §9: Anti-cheat 속도 상한 — 초당 최대 100점
const MAX_SCORE_PER_SECOND = 100;

type Milestones = Record<string, boolean>;

function validateMilestones(score: number, milestones: Milestones): string | null {
  // score가 마일스톤 이상인데 해당 milestone이 false면 reject
  for (const [threshold, key] of MILESTONE_THRESHOLDS) {
    if (score >= threshold && milestones[key] === false) {
      return `점수 ${score}인데 마일스톤 ${key}일이 false야 — 데이터 불일치`;
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  const { handleCors, jsonResponse, errorResponse } = makeHelpers(req);
  const corsResult = handleCors();
  if (corsResult) return corsResult;

  if (req.method !== "POST") {
    return errorResponse("POST만 허용돼", 405);
  }

  // 인증
  const { player, response: authError } = await requirePlayer(req);
  if (authError) return authError;

  let body: {
    game_session_id?: unknown;
    score?: unknown;
    duration_ms?: unknown;
    death_cause?: unknown;
    milestones?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("JSON 파싱 실패", 400);
  }

  const { game_session_id, score, duration_ms, death_cause, milestones } = body;

  // 필드 타입 검증
  if (typeof game_session_id !== "string" || !game_session_id) {
    return errorResponse("game_session_id가 필요해", 400);
  }
  if (typeof score !== "number" || !Number.isInteger(score)) {
    return errorResponse("score는 정수여야 해", 400);
  }
  if (typeof duration_ms !== "number" || !Number.isInteger(duration_ms)) {
    return errorResponse("duration_ms는 정수여야 해", 400);
  }
  if (typeof death_cause !== "string" || !VALID_DEATH_CAUSES.has(death_cause)) {
    return errorResponse(
      `death_cause가 올바르지 않아. 허용값: ${[...VALID_DEATH_CAUSES].join(", ")}`,
      400,
    );
  }
  if (typeof milestones !== "object" || milestones === null || Array.isArray(milestones)) {
    return errorResponse("milestones는 object여야 해", 400);
  }

  // Anti-cheat 검증
  if (score < 0) {
    return jsonResponse({ accepted: false, reason: "점수는 0 이상이어야 해" });
  }
  if (duration_ms < 5000) {
    return jsonResponse({ accepted: false, reason: "플레이 시간이 너무 짧아 (최소 5초)" });
  }
  const durationSec = duration_ms / 1000;
  if (score / durationSec > MAX_SCORE_PER_SECOND) {
    return jsonResponse({ accepted: false, reason: "점수/시간 비율이 비정상이야" });
  }

  // 마일스톤 일관성 검증
  const milestoneError = validateMilestones(score as number, milestones as Milestones);
  if (milestoneError) {
    return jsonResponse({ accepted: false, reason: milestoneError });
  }

  const db = getServiceClient();
  const now = new Date().toISOString();

  // 세션 조회
  const { data: session, error: sessionError } = await db
    .from("game_sessions")
    .select("id, player_id, consumed, expires_at")
    .eq("id", game_session_id)
    .maybeSingle();

  if (sessionError || !session) {
    return jsonResponse({ accepted: false, reason: "세션을 찾을 수 없어" });
  }
  if (session.player_id !== player.id) {
    return jsonResponse({ accepted: false, reason: "세션 소유자가 달라" });
  }
  if (session.consumed) {
    return jsonResponse({ accepted: false, reason: "이미 사용된 세션이야" });
  }
  if (session.expires_at < now) {
    return jsonResponse({ accepted: false, reason: "세션이 만료됐어" });
  }

  const prevBestScore = player.best_score;

  // 점수 INSERT (트리거가 best_score 자동 갱신)
  const { error: insertError } = await db
    .from("scores")
    .insert({
      player_id: player.id,
      game_session_id,
      score,
      duration_ms,
      death_reason: death_cause,
      milestones,
    });

  if (insertError) {
    console.error("submit-score insert error:", insertError);
    return jsonResponse({ accepted: false, reason: "점수 저장 중 오류가 발생했어" });
  }

  // 세션 consumed = true
  await db
    .from("game_sessions")
    .update({ consumed: true })
    .eq("id", game_session_id);

  // 갱신된 player 조회 (best_score, rank 계산용)
  const { data: updatedPlayer } = await db
    .from("players")
    .select("best_score")
    .eq("id", player.id)
    .single();

  const newBestScore = updatedPlayer?.best_score ?? prevBestScore;
  const newBest = (score as number) > prevBestScore;

  // 전체 랭킹 조회
  const { data: rankRow } = await db
    .from("all_time_leaderboard")
    .select("rank")
    .eq("id", player.id)
    .maybeSingle();

  const currentRank = rankRow?.rank ?? null;

  // 응모권 = best_score (PRD §6)
  const tickets = newBestScore;

  return jsonResponse({
    accepted: true,
    new_best: newBest,
    current_rank: currentRank,
    tickets,
  });
});
