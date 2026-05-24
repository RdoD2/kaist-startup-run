import { getServiceClient } from "./supabase.ts";
import { makeHelpers } from "./cors.ts";

export type Player = {
  id: string;
  anon_token: string;
  nickname: string | null;
  student_id: string | null;
  real_name: string | null;
  department: string | null;
  privacy_consent_at: string | null;
  registration_step: number;
  is_verified: boolean;
  best_score: number;
  best_score_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function requirePlayer(
  req: Request,
): Promise<{ player: Player; response: null } | { player: null; response: Response }> {
  const { errorResponse } = makeHelpers(req);

  const authHeader = req.headers.get("Authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { player: null, response: errorResponse("Authorization 헤더가 없거나 형식이 잘못됐어 (Bearer {token})", 401) };
  }

  const token = match[1].trim();
  if (!token) {
    return { player: null, response: errorResponse("anon_token이 비어 있어", 401) };
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("players")
    .select("*")
    .eq("anon_token", token)
    .single();

  if (error || !data) {
    return { player: null, response: errorResponse("유효하지 않은 토큰이야", 401) };
  }

  return { player: data as Player, response: null };
}
