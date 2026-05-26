import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  const key = req.nextUrl.searchParams.get('key');

  if (!secret || key !== secret) {
    return new NextResponse('403 Forbidden', { status: 403 });
  }

  const db = getServiceClient();
  const { data: players, error } = await db
    .from('players')
    .select('nickname, real_name, student_id, department, best_score, best_score_at, created_at')
    .eq('is_verified', true)
    .order('best_score', { ascending: false });

  if (error) {
    return new NextResponse('DB 오류: ' + error.message, { status: 500 });
  }

  const rows = players ?? [];

  function kst(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  }

  function csvEscape(val: string | number | null): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const headers = ['닉네임', '실명', '학번', '학과', '최고점수(응모권)', '최고점수 달성일시', '가입일시'];
  const csvLines = [
    headers.map(csvEscape).join(','),
    ...rows.map((p) =>
      [
        csvEscape(p.nickname),
        csvEscape(p.real_name),
        csvEscape(p.student_id),
        csvEscape(p.department),
        csvEscape(p.best_score),
        csvEscape(kst(p.best_score_at)),
        csvEscape(kst(p.created_at)),
      ].join(','),
    ),
  ];

  // UTF-8 BOM 추가 — Excel에서 한글 깨짐 방지
  const bom = '﻿';
  const csv = bom + csvLines.join('\r\n');

  const filename = `startup-run-players-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
