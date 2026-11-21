import "server-only";
import postgres from "postgres";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

declare global {
  var __bw_sql: ReturnType<typeof postgres> | undefined;
  var __bw_migrated: Promise<void> | undefined;
}

function client() {
  if (!url) throw new Error("DATABASE_URL is not set. See README for setup.");
  if (!global.__bw_sql) {
    const local = /localhost|127\.0\.0\.1/.test(url);
    global.__bw_sql = postgres(url, { ssl: local ? false : "require", max: 3, prepare: false, idle_timeout: 20 });
  }
  return global.__bw_sql;
}

const SCHEMA = `
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  password_hash text,
  name text,
  is_guest boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  resume_text text,
  persona_id text,
  current_role_title text,
  years_experience numeric,
  city text,
  target text,
  summary text,
  projects jsonb not null default '[]',
  constraints jsonb not null,
  selected_role text,
  selected_route text,
  updated_at timestamptz not null default now()
);
create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  skill_id text not null,
  label text not null,
  status text not null,
  evidence text not null,
  source text not null,
  verdict text,
  created_at timestamptz not null default now()
);
create index if not exists claims_user on claims(user_id);
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  skill_id text,
  question text not null,
  why text not null,
  answer text,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null,
  role_slug text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists artifacts_user_kind on artifacts(user_id, kind, created_at desc);
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  role_slug text not null,
  route_type text not null,
  version int not null,
  reason text not null,
  hours_per_week numeric not null,
  weeks int not null,
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  position int not null,
  title text not null,
  detail text not null,
  hours numeric not null,
  kind text not null,
  skill_id text,
  output text not null,
  start_week int not null,
  end_week int not null,
  status text not null default 'todo',
  note text
);
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
`;

export async function sql() {
  const s = client();
  if (!global.__bw_migrated) {
    global.__bw_migrated = s.unsafe(SCHEMA).then(() => undefined).catch((e) => {
      global.__bw_migrated = undefined;
      throw e;
    });
  }
  await global.__bw_migrated;
  return s;
}
