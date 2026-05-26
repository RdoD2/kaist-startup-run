import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
// Supabase가 anon key를 publishable key로 이름 변경함. 두 이름 모두 지원.
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

// 브라우저 — anon key. 리더보드 view SELECT용.
let browserClient: SupabaseClient | null = null;
export function getBrowserClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('SUPABASE env vars not set');
  }
  browserClient ??= createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return browserClient;
}

// 서버 (Edge Function / API route) — service_role
export function getServiceClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !serviceKey) {
    throw new Error('SUPABASE service env vars not set');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
