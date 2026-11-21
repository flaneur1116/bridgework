import "server-only";
import { sql } from "./db";
import type { Claim } from "./engine";
import { DEFAULT_CONSTRAINTS, type Constraints } from "./data/personas";

export type Profile = {
  resumeText: string | null;
  personaId: string | null;
  currentRole: string | null;
  yearsExperience: number | null;
  city: string | null;
  target: string | null;
  summary: string | null;
  projects: { name: string; summary: string; scale: string }[];
  constraints: Constraints;
  selectedRole: string | null;
  selectedRoute: string | null;
};

export type Question = { id: string; skillId: string | null; question: string; why: string; answer: string | null };

export type Milestone = {
  id: string;
  position: number;
  title: string;
  detail: string;
  hours: number;
  kind: string;
  skillId: string | null;
  output: string;
  startWeek: number;
  endWeek: number;
  status: "todo" | "done" | "stuck";
  note: string | null;
};

export type Plan = { id: string; roleSlug: string; routeType: string; version: number; reason: string; hoursPerWeek: number; weeks: number; note: string | null; createdAt: string };

export async function getProfile(userId: string): Promise<Profile | null> {
  const db = await sql();
  const r = (await db`select * from profiles where user_id = ${userId}`)[0];
  if (!r) return null;
  return {
    resumeText: r.resume_text,
    personaId: r.persona_id,
    currentRole: r.current_role_title,
    yearsExperience: r.years_experience == null ? null : Number(r.years_experience),
    city: r.city,
    target: r.target,
    summary: r.summary,
    projects: r.projects ?? [],
    constraints: { ...DEFAULT_CONSTRAINTS, ...(r.constraints ?? {}) },
    selectedRole: r.selected_role,
    selectedRoute: r.selected_route,
  };
}

export async function getClaims(userId: string): Promise<Claim[]> {
  const db = await sql();
  const rows = await db`select * from claims where user_id = ${userId} order by created_at, label`;
  return rows.map((r) => ({ id: r.id, skillId: r.skill_id, label: r.label, status: r.status, evidence: r.evidence, source: r.source, verdict: r.verdict }));
}

export async function getQuestions(userId: string): Promise<Question[]> {
  const db = await sql();
  const rows = await db`select * from questions where user_id = ${userId} order by created_at`;
  return rows.map((r) => ({ id: r.id, skillId: r.skill_id, question: r.question, why: r.why, answer: r.answer }));
}

export async function getArtifact<T>(userId: string, kind: string, roleSlug?: string | null): Promise<{ payload: T; createdAt: string } | null> {
  const db = await sql();
  const rows = roleSlug
    ? await db`select payload, created_at from artifacts where user_id = ${userId} and kind = ${kind} and role_slug = ${roleSlug} order by created_at desc limit 1`
    : await db`select payload, created_at from artifacts where user_id = ${userId} and kind = ${kind} order by created_at desc limit 1`;
  return rows[0] ? { payload: rows[0].payload as T, createdAt: rows[0].created_at.toISOString() } : null;
}

export async function saveArtifact(userId: string, kind: string, roleSlug: string | null, payload: unknown) {
  const db = await sql();
  await db`insert into artifacts (user_id, kind, role_slug, payload) values (${userId}, ${kind}, ${roleSlug}, ${db.json(payload as never)})`;
}

export async function getActivePlan(userId: string): Promise<{ plan: Plan; milestones: Milestone[] } | null> {
  const db = await sql();
  const p = (await db`select * from plans where user_id = ${userId} and active order by version desc limit 1`)[0];
  if (!p) return null;
  const ms = await db`select * from milestones where plan_id = ${p.id} order by position`;
  return {
    plan: { id: p.id, roleSlug: p.role_slug, routeType: p.route_type, version: p.version, reason: p.reason, hoursPerWeek: Number(p.hours_per_week), weeks: p.weeks, note: p.note, createdAt: p.created_at.toISOString() },
    milestones: ms.map((m) => ({
      id: m.id, position: m.position, title: m.title, detail: m.detail, hours: Number(m.hours), kind: m.kind, skillId: m.skill_id, output: m.output, startWeek: m.start_week, endWeek: m.end_week, status: m.status, note: m.note,
    })),
  };
}

export async function getPlanHistory(userId: string): Promise<Plan[]> {
  const db = await sql();
  const rows = await db`select * from plans where user_id = ${userId} order by version desc`;
  return rows.map((p) => ({ id: p.id, roleSlug: p.role_slug, routeType: p.route_type, version: p.version, reason: p.reason, hoursPerWeek: Number(p.hours_per_week), weeks: p.weeks, note: p.note, createdAt: p.created_at.toISOString() }));
}

export async function getEvents(userId: string, type?: string) {
  const db = await sql();
  const rows = type
    ? await db`select type, payload, created_at from events where user_id = ${userId} and type = ${type} order by created_at desc limit 50`
    : await db`select type, payload, created_at from events where user_id = ${userId} order by created_at desc limit 100`;
  return rows.map((r) => ({ type: r.type as string, payload: r.payload as Record<string, unknown>, createdAt: r.created_at.toISOString() as string }));
}

export async function logEvent(userId: string, type: string, payload: Record<string, unknown>) {
  const db = await sql();
  await db`insert into events (user_id, type, payload) values (${userId}, ${type}, ${db.json(payload as never)})`;
}
