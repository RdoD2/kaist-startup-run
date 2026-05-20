-- =========================================================================
-- STARTUP RUN — Supabase schema
-- 클라이언트는 leaderboard 뷰만 직접 SELECT. 모든 쓰기는 Edge Function 경유.
-- =========================================================================

create extension if not exists pgcrypto;

-- ---------- ENUMS ----------

create type death_cause as enum (
  'investor_pass',     -- 투자자 거절
  'burnout',           -- 번아웃 좀비
  'cofounder_left',    -- 코파운더 이탈
  'competitor',        -- 경쟁사 화살
  'lawsuit',           -- 법무 이슈
  'pivot_fail',        -- 피봇 실패
  'demo_day',          -- 데모데이 실패
  'cash_dry',          -- 자금 고갈 (월세, AWS 청구서 등)
  'regulation',        -- 규제 위반 (정부 규제, 세무조사 등)
  'product_fail'       -- 프로덕트 실패 (버그)
);

-- ---------- TABLES ----------

create table players (
  id                  uuid primary key default gen_random_uuid(),
  anon_token          text not null unique,
  nickname            text unique,
  student_id          text unique,                 -- 8자리 KAIST 학번
  real_name           text,
  department          text,
  privacy_consent_at  timestamptz,
  registration_step   smallint not null default 0
                      check (registration_step between 0 and 4),
  is_verified         boolean generated always as (
    nickname is not null and student_id is not null and
    real_name is not null and department is not null and
    privacy_consent_at is not null
  ) stored,
  best_score          integer not null default 0,
  best_score_at       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_players_best_score on players (best_score desc, best_score_at asc);
create index idx_players_anon_token on players (anon_token);

create table scores (
  id               uuid primary key default gen_random_uuid(),
  player_id        uuid not null references players(id) on delete cascade,
  game_session_id  uuid not null,
  score            integer not null check (score >= 0),
  duration_ms      integer not null check (duration_ms >= 5000),
  death_reason     death_cause not null,
  milestones       jsonb not null default '{}'::jsonb,
  played_at        timestamptz not null default now()
);

create unique index uq_scores_session on scores (game_session_id);
create index idx_scores_player on scores (player_id);
create index idx_scores_played on scores (played_at desc);

create table game_sessions (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  started_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '10 minutes'),
  consumed    boolean not null default false
);

create index idx_sessions_player_alive on game_sessions (player_id)
  where consumed = false;

-- ---------- TRIGGERS ----------

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create trigger trg_players_touch
  before update on players
  for each row execute function touch_updated_at();

-- best_score 갱신 트리거 (scores INSERT 시 자동)
create or replace function update_best_score()
returns trigger language plpgsql as $$
begin
  update players
     set best_score    = new.score,
         best_score_at = new.played_at
   where id = new.player_id
     and new.score > best_score;
  return new;
end
$$;

create trigger trg_scores_best
  after insert on scores
  for each row execute function update_best_score();

-- ---------- VIEWS ----------

create or replace view all_time_leaderboard as
select
  p.id,
  p.nickname,
  p.best_score                                   as score,
  p.best_score_at,
  rank() over (order by p.best_score desc, p.best_score_at asc) as rank
from players p
where p.is_verified = true
  and p.best_score > 0;

create or replace view daily_leaderboard as
with today_kst as (
  select date_trunc('day', now() at time zone 'Asia/Seoul')
         at time zone 'Asia/Seoul' as start_ts
),
today_scores as (
  select s.player_id,
         max(s.score) as score,
         min(s.played_at) filter (where s.score is not null) as best_at
  from scores s, today_kst
  where s.played_at >= today_kst.start_ts
  group by s.player_id
)
select
  p.id,
  p.nickname,
  t.score,
  t.best_at,
  rank() over (order by t.score desc, t.best_at asc) as rank
from today_scores t
join players p on p.id = t.player_id
where p.is_verified = true;

-- ---------- RLS ----------

alter table players       enable row level security;
alter table scores        enable row level security;
alter table game_sessions enable row level security;

-- anon 키로는 정책 없음 = 전부 deny. service_role만 통과.

-- 리더보드 뷰만 anon read 허용
grant select on all_time_leaderboard to anon;
grant select on daily_leaderboard    to anon;
revoke all on players       from anon;
revoke all on scores        from anon;
revoke all on game_sessions from anon;
