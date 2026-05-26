// @ts-ignore Deno runtime
const rawOrigin = Deno.env.get("CORS_ORIGIN") ?? "*";
const allowedOrigins = rawOrigin.split(",").map((s: string) => s.trim());

function resolveOrigin(requestOrigin: string): string {
  if (allowedOrigins.includes("*")) return "*";
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
}

export function makeHelpers(req: Request) {
  const origin = resolveOrigin(req.headers.get("Origin") ?? "");
  const corsH: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey",
  };

  function handleCors(): Response | null {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsH });
    }
    return null;
  }

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsH, "Content-Type": "application/json" },
    });
  }

  function errorResponse(message: string, status = 400): Response {
    return jsonResponse({ error: message }, status);
  }

  return { handleCors, jsonResponse, errorResponse };
}
