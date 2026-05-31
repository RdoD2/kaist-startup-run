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

// 정렬 가능한 컬럼: 화면 라벨 → DB 컬럼
const COLUMNS: { label: string; sort?: string; align?: 'left' | 'right' | 'center' }[] = [
  { label: '#' },
  { label: '닉네임', sort: 'nickname' },
  { label: '실명', sort: 'real_name' },
  { label: '학번', sort: 'student_id' },
  { label: '학과', sort: 'department' },
  { label: '등록단계', sort: 'registration_step' },
  { label: '완료', sort: 'is_verified', align: 'center' },
  { label: '점수(응모권)', sort: 'best_score', align: 'right' },
  { label: '가입일시 (KST)', sort: 'created_at' },
];
const SORTABLE = new Set(COLUMNS.map((c) => c.sort).filter(Boolean) as string[]);

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string; filter?: string; sort?: string; dir?: string };
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

  // 정렬 상태 — 기본은 가입일시 내림차순
  const sort = searchParams.sort && SORTABLE.has(searchParams.sort) ? searchParams.sort : 'created_at';
  const dir: 'asc' | 'desc' = searchParams.dir === 'asc' ? 'asc' : 'desc';

  let query = db
    .from('players')
    .select(
      'id, nickname, real_name, student_id, department, registration_step, is_verified, best_score, best_score_at, created_at',
    );

  if (filter === 'verified') query = query.eq('is_verified', true);
  if (filter === 'incomplete') query = query.eq('is_verified', false);

  query = query
    .order(sort, { ascending: dir === 'asc', nullsFirst: false })
    .order('created_at', { ascending: false }); // 동점 시 안정 정렬

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

  // 퍼널 — 전체 가입자 기준(필터 무관) 등록 단계별 누적 인원
  const { data: allSteps } = await db.from('players').select('registration_step, is_verified');
  const stepArr = (allSteps ?? []).map((r) => r.registration_step as number);
  const totalAll = stepArr.length;
  const reachedAtLeast = (n: number) => stepArr.filter((s) => s >= n).length;
  // '완료'는 통계카드 '등록완료'와 동일하게 is_verified 기준으로 집계 (숫자 정합)
  const verifiedCount = (allSteps ?? []).filter((r) => r.is_verified === true).length;
  const FUNNEL: { label: string; count: number }[] = [
    { label: '가입 진입', count: totalAll },
    { label: '닉네임', count: reachedAtLeast(1) },
    { label: '학번', count: reachedAtLeast(2) },
    { label: '실명/학과', count: reachedAtLeast(3) },
    { label: '완료', count: verifiedCount },
  ];

  const tab = (f: string, label: string) => (
    <a
      href={`?key=${key}&filter=${f}&sort=${sort}&dir=${dir}`}
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

      {/* 등록 퍼널 (깔때기) */}
      <div style={{ border: '2px solid #000', padding: '16px 20px', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.05em' }}>
          등록 퍼널 — 단계별 도달 인원
        </div>
        {FUNNEL.map((stage, i) => {
          const pct = totalAll ? Math.round((stage.count / totalAll) * 100) : 0;
          // 윗변 = 현재 단계 인원, 아랫변 = 다음 단계 인원 → 사다리꼴이 이어져 깔때기 형태
          const topW = totalAll ? (stage.count / totalAll) * 100 : 0;
          const next = FUNNEL[i + 1];
          const botW = next && totalAll ? (next.count / totalAll) * 100 : topW;
          const left = (100 - topW) / 2;
          const leftB = (100 - botW) / 2;
          const prev = i > 0 ? FUNNEL[i - 1]!.count : null;
          const conv = prev && prev > 0 ? Math.round((stage.count / prev) * 100) : null;
          const dropoff = prev !== null ? prev - stage.count : null;
          return (
            <div
              key={stage.label}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <div style={{ width: '72px', textAlign: 'right', fontSize: '11px', opacity: 0.7, whiteSpace: 'nowrap' }}>
                {stage.label}
              </div>
              {/* 깔때기 사다리꼴 한 칸 */}
              <div style={{ flex: 1, height: '48px', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `hsl(220, 16%, ${16 + i * 8}%)`,
                    clipPath: `polygon(${left}% 0, ${100 - left}% 0, ${100 - leftB}% 100%, ${leftB}% 100%)`,
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    textShadow: '0 0 4px rgba(0,0,0,0.9)',
                  }}
                >
                  {stage.count}
                </div>
              </div>
              <div style={{ width: '150px', fontSize: '11px', opacity: 0.7, whiteSpace: 'nowrap' }}>
                {pct}% of 전체
                {conv !== null && (
                  <span style={{ color: conv < 70 ? '#cc0000' : '#006600' }}>
                    {' · 전환 '}
                    {conv}%
                  </span>
                )}
                {dropoff !== null && dropoff > 0 && (
                  <span style={{ opacity: 0.5 }}> (-{dropoff})</span>
                )}
              </div>
            </div>
          );
        })}
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
              {COLUMNS.map((col) => {
                const active = col.sort === sort;
                const nextDir = active && dir === 'asc' ? 'desc' : 'asc';
                const arrow = active ? (dir === 'asc' ? ' ▲' : ' ▼') : '';
                const thStyle = {
                  padding: '6px 10px',
                  textAlign: col.align ?? 'left',
                  whiteSpace: 'nowrap',
                  fontWeight: 'normal',
                } as const;
                if (!col.sort) {
                  return (
                    <th key={col.label} style={thStyle}>
                      {col.label}
                    </th>
                  );
                }
                return (
                  <th key={col.label} style={thStyle}>
                    <a
                      href={`?key=${key}&filter=${filter}&sort=${col.sort}&dir=${nextDir}`}
                      style={{ color: '#fff', textDecoration: 'none', cursor: 'pointer' }}
                    >
                      {col.label}
                      {arrow}
                    </a>
                  </th>
                );
              })}
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
