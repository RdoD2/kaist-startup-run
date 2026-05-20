/**
 * HMAC SHA-256 서명 (server-only).
 * 형태: hmac(SCORE_HMAC_SECRET, "{sessionId}|{score}|{durationMs}")
 *
 * 현재는 서버 내부 검증에만 사용. 클라이언트는 HMAC을 전송할 필요 없음.
 * TODO: 클라이언트 서명 검증이 필요해지면 여기에 verifyHmac() 추가.
 */
export async function signScore(
  sessionId: string,
  score: number,
  durationMs: number,
): Promise<string> {
  const secret = Deno.env.get("SCORE_HMAC_SECRET");
  if (!secret) throw new Error("SCORE_HMAC_SECRET 환경변수 누락");

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const data = enc.encode(`${sessionId}|${score}|${durationMs}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 두 HMAC hex string을 타이밍 공격 없이 비교 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
