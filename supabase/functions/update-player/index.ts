import { makeHelpers } from "../_shared/cors.ts";
import { requirePlayer } from "../_shared/auth.ts";
import { getServiceClient } from "../_shared/supabase.ts";

// 학번: 정확히 8자리 숫자
const STUDENT_ID_RE = /^\d{8}$/;

Deno.serve(async (req: Request) => {
  const { handleCors, jsonResponse, errorResponse } = makeHelpers(req);
  const corsResult = handleCors();
  if (corsResult) return corsResult;

  if (req.method !== "PATCH") {
    return errorResponse("PATCH만 허용돼", 405);
  }

  // 인증
  const { player, response: authError } = await requirePlayer(req);
  if (authError) return authError;

  let body: { step?: unknown; fields?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return errorResponse("JSON 파싱 실패", 400);
  }

  const step = body.step;
  const fields = body.fields ?? {};

  if (step !== 2 && step !== 3 && step !== 4) {
    return errorResponse("step은 2, 3, 4 중 하나여야 해", 400);
  }

  // 스텝 순서 강제 (이전 스텝을 완료하지 않으면 진행 불가)
  if (player.registration_step < step - 1) {
    return errorResponse(
      `step ${step - 1}을 먼저 완료해야 해`,
      400,
    );
  }

  const db = getServiceClient();
  let updateData: Record<string, unknown> = {};

  if (step === 2) {
    // 학번 검증
    const studentId = fields.student_id;
    if (typeof studentId !== "string" || !STUDENT_ID_RE.test(studentId)) {
      return errorResponse("학번은 8자리 숫자여야 해", 400);
    }

    // 학번 중복 체크
    const { data: existing } = await db
      .from("players")
      .select("id")
      .eq("student_id", studentId)
      .neq("id", player.id)
      .maybeSingle();

    if (existing) {
      return errorResponse("이미 등록된 학번이야 (1인 1계정)", 409);
    }

    updateData = { student_id: studentId, registration_step: 2 };
  } else if (step === 3) {
    // 이름 + 학과 검증
    const realName = fields.real_name;
    const department = fields.department;

    if (typeof realName !== "string" || realName.trim().length === 0) {
      return errorResponse("이름을 입력해줘", 400);
    }
    if (typeof department !== "string" || department.trim().length === 0) {
      return errorResponse("학과를 입력해줘", 400);
    }

    updateData = {
      real_name: realName.trim(),
      department: department.trim(),
      registration_step: 3,
    };
  } else if (step === 4) {
    // 개인정보 동의
    const privacyConsent = fields.privacy_consent;
    if (privacyConsent !== true) {
      return errorResponse("개인정보 동의가 필요해 (privacy_consent: true)", 400);
    }

    updateData = {
      privacy_consent_at: new Date().toISOString(),
      registration_step: 4,
    };
  }

  const { data: updated, error } = await db
    .from("players")
    .update(updateData)
    .eq("id", player.id)
    .select("*")
    .single();

  if (error || !updated) {
    console.error("update-player error:", error);
    return errorResponse("업데이트 중 오류가 발생했어", 500);
  }

  return jsonResponse({ player: updated, is_verified: updated.is_verified });
});
