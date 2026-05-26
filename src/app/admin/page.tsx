import { getServiceClient } from '@/lib/supabase';

type PlayerRow = {
  id: string;
  nickname: string | null;
  real_name: string | null;
  student_id: string | null;
  department: string | null;
  registration_step: number;
  is_verified: boolean;
  best_score: number;
  best_score_at: string | null;
  created_at: string;
};

const STEP_LABELS: Record<number, string> = {
  0: '미시작',
  1: '닉네임',
  2: '학번',
  3: '실명/학과',
  4: '완료',
};

function kst(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

function kstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string; filter?: string };
}) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || searchParams.key !== secret) {
    return (
      <div className="p-8 font-mono text-sm">
        <p className="text-red-600 font-bold">403 — 접근 불가</p>
        <p className="mt-2 opacity-60">?key= 파라미터를 확인하세요.</p>
      </div>
    );
  }

  const db = getServiceClient();
  const filter = searchParams.filter ?? 'all';
  const key = searchParams.key;

  let query = db
    .from('players')
    .select(
      'id, nickname, real_name, student_id, department, registration_step, is_verified, best_score, best_score_at, created_at',
    )
    .order('created_at', { ascending: false });

  if (filter === 'verified') query = query.eq('is_verified', true);
  if (filter === 'incomplete') query = query.eq('is_verified', false);

  const { data: players } = await query;
  const rows = (players ?? []) as PlayerRow[];

  const { count: total } = await db
    .from('players')
    .select('*', { count: 'exact', head: true });
  const { count: verified } = await db
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', true);
  const { count: todayCount } = await db
    .from('players')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${kstToday()}T00:00:00+09:00`);

  const ticketSum = rows.reduce((s, p) => s + (p.best_score || 0), 0);

  const tab = (f: string, label: string) => (
    <a
      href={`?key=${key}&filter=${f}`}
      style={{
        display: 'inline-block',
        padding: '4px 14px',
        border: '2px solid #000',
        textDecoration: 'none',
        color: filter === f ? '#fff' : '#000',
        background: filter === f ? '#000' : '#fff',
        fontFamily: 'monospace',
        fontSize: '12px',
        marginRight: '4px',
      }}
    >
      {label}
    </a>
  );

  return (
    <div style={{ fontFamily: 'monospace', padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', fontSize: '13px', lineHeight: '1.5' }}>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>
        STARTUP RUN — 관리자
      </h1>

      {/* 통계 카드 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(
          [
            ['총 가입자', total ?? 0],
            ['등록완료', verified ?? 0],
            ['오늘 가입', todayCount ?? 0],
            ['응모권 합계', ticketSum],
          ] as [string, number][]
        ).map(([label, value]) => (
          <div
            key={label}
            style={{ border: '2px solid #000', padding: '12px 20px', minWidth: '110px' }}
          >
            <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 필터 + 내보내기 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        {tab('all', '전체')}
        {tab('verified', '등록완료')}
        {tab('incomplete', '미완료')}
        <a
          href={`/api/admin/export?key=${key}`}
          style={{
            marginLeft: 'auto',
            border: '2px solid #000',
            padding: '4px 14px',
            textDecoration: 'none',
            color: '#000',
            background: '#d4f5d4',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          CSV 내보내기 (등록완료만)
        </a>
      </div>

      {/* 플레이어 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#000', color: '#fff' }}>
              {['#', '닉네임', '실명', '학번', '학과', '등록단계', '완료', '점수(응모권)', '가입일시 (KST)'].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: '6px 10px',
                      textAlign: h === '점수(응모권)' ? 'right' : 'left',
                      whiteSpace: 'nowrap',
                      fontWeight: 'normal',
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr
                key={p.id}
                style={{
                  borderBottom: '1px solid #ddd',
                  background: i % 2 === 0 ? '#fff' : '#f8f8f8',
                  color: '#000000',
                }}
              >
                <td style={{ padding: '5px 10px', opacity: 0.5 }}>{i + 1}</td>
                <td style={{ padding: '5px 10px' }}>{p.nickname ?? <span style={{ opacity: 0.4 }}>-</span>}</td>
                <td style={{ padding: '5px 10px' }}>{p.real_name ?? <span style={{ opacity: 0.4 }}>-</span>}</td>
                <td style={{ padding: '5px 10px', fontFamily: 'monospace' }}>{p.student_id ?? <span style={{ opacity: 0.4 }}>-</span>}</td>
                <td style={{ padding: '5px 10px' }}>{p.department ?? <span style={{ opacity: 0.4 }}>-</span>}</td>
                <td style={{ padding: '5px 10px' }}>{STEP_LABELS[p.registration_step] ?? p.registration_step}</td>
                <td style={{ padding: '5px 10px', textAlign: 'center', color: p.is_verified ? '#006600' : '#999' }}>
                  {p.is_verified ? '✓' : ''}
                </td>
                <td style={{ padding: '5px 10px', textAlign: 'right' }}>
                  {p.best_score > 0 ? <strong>{p.best_score}</strong> : <span style={{ opacity: 0.3 }}>-</span>}
                </td>
                <td style={{ padding: '5px 10px', whiteSpace: 'nowrap', opacity: 0.7 }}>{kst(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p style={{ textAlign: 'center', padding: '3rem', opacity: 0.4 }}>플레이어 없음</p>
      )}

      <p style={{ marginTop: '12px', opacity: 0.4, fontSize: '11px' }}>
        {rows.length}명 표시 / 총 {total ?? 0}명 가입
      </p>
    </div>
  );
}
