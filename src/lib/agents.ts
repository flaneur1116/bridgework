import "server-only";
import { sql } from "./db";
import {
  callTool, callText, MODEL_FAST, MODEL_SMART, SKILL_LIST,
  ExtractSchema, QuestionsSchema, AnswersSchema, ExplainSchema, PlanSchema, BriefSchema, GradeSchema, DiagnoseSchema,
} from "./ai";
import { getClaims, getProfile, getQuestions, getActivePlan, saveArtifact, logEvent, getArtifact } from "./store";
import { rankRoles, computeRoutes, packMilestones, fitRole, ROUTE_NAMES, type RouteType, type MilestoneInput, type Claim } from "./engine";
import { getRole } from "./data/roles";
import { skillLabel } from "./data/skills";
import type { Constraints } from "./data/personas";
import { HttpError } from "./auth";
import type { z } from "zod";
import { ROHAN_EXTRACT, EXPLAIN, PLAN_CONSULTING, DIAGNOSIS, BRIEF_CONSULTING } from "./fixtures";

const norm = (s: string) => s.toLowerCase().replace(/[“”"'`’]/g, "").replace(/[^a-z0-9%.]+/g, " ").trim();

function verifyQuote(quote: string, source: string) {
  const q = norm(quote);
  if (q.length < 6) return false;
  return norm(source).includes(q);
}

function ledgerText(claims: Claim[]) {
  return claims
    .filter((c) => c.verdict !== "rejected")
    .map((c) => `- [${c.id}] ${c.skillId} (${c.status}${c.verdict ? ", user " + c.verdict : ""}): ${c.label} | evidence: "${c.evidence}"`)
    .join("\n");
}

// ---------- 1. Intake: resume -> evidence ledger ----------

export async function analyseResume(userId: string, input: { resumeText: string; personaId: string | null; target: string; constraints: Constraints }) {
  const resume = input.resumeText.trim().slice(0, 20000);
  if (resume.length < 200) throw new HttpError(400, "That resume is too short to analyse. Paste the full text or upload the PDF.");

  const out = await callTool({
    userId,
    tool: "record_profile",
    description: "Record the structured profile and capability claims extracted from a resume.",
    schema: ExtractSchema,
    model: MODEL_SMART,
    maxTokens: 5000,
    system: `Extract capability claims from a resume for a career-transition analysis.
Skill ids you may use (pick the closest; never invent ids):
${SKILL_LIST}

Status rules:
- demonstrated: the resume shows the person doing it, with a concrete specific (numbers, scope, named output).
- inferred: plausible from their work but not shown directly. Example: an architect who ran client workshops probably did some stakeholder management, but if no outcome is stated it stays inferred.
- Do not stretch: an Excel tracker is spreadsheet modelling, not SQL. Presenting to clients is not market research.
- evidence must be copied character for character from the resume. Never paraphrase inside evidence.
- Up to two claims per skill id when there is distinct evidence. Cover the whole career, not just the latest job.`,
    prompt: `Target direction stated by the person: ${input.target || "not stated"}\n\nRESUME:\n${resume}`,
    mock: () => (resume.includes("ROHAN DESHPANDE") ? (JSON.parse(JSON.stringify(ROHAN_EXTRACT)) as never) : mockExtract(resume)),
  });

  let downgraded = 0;
  const claims = out.claims.map((c) => {
    if (verifyQuote(c.evidence, resume)) return c;
    downgraded++;
    return { ...c, status: "inferred" as const, evidence: `Unverified quote: ${c.evidence}` };
  });

  const db = await sql();
  await db.begin(async (tx) => {
    await tx`delete from claims where user_id = ${userId}`;
    await tx`delete from questions where user_id = ${userId}`;
    await tx`update plans set active = false where user_id = ${userId}`;
    await tx`delete from artifacts where user_id = ${userId}`;
    await tx`
      insert into profiles (user_id, resume_text, persona_id, current_role_title, years_experience, city, target, summary, projects, constraints, selected_role, selected_route, updated_at)
      values (${userId}, ${resume}, ${input.personaId}, ${out.currentRole}, ${out.yearsExperience}, ${out.city ?? null}, ${input.target}, ${out.summary}, ${tx.json(out.projects)}, ${tx.json(input.constraints as never)}, null, null, now())
      on conflict (user_id) do update set resume_text = excluded.resume_text, persona_id = excluded.persona_id, current_role_title = excluded.current_role_title,
        years_experience = excluded.years_experience, city = excluded.city, target = excluded.target, summary = excluded.summary, projects = excluded.projects,
        constraints = excluded.constraints, selected_role = null, selected_route = null, updated_at = now()`;
    for (const c of claims) {
      await tx`insert into claims (user_id, skill_id, label, status, evidence, source) values (${userId}, ${c.skillId}, ${c.label}, ${c.status}, ${c.evidence}, 'resume')`;
    }
    if (out.name) await tx`update users set name = coalesce(name, ${out.name}) where id = ${userId}`;
  });
  await logEvent(userId, "intake", { claims: claims.length, downgraded });
  await generateQuestions(userId);
  return { claims: claims.length, downgraded };
}

// ---------- 2. Targeted follow-up questions ----------

export async function generateQuestions(userId: string) {
  const claims = await getClaims(userId);
  const profile = await getProfile(userId);
  const fits = rankRoles(claims).slice(0, 3);
  const weak = fits.flatMap((f) => f.matches.filter((m) => m.state !== "demonstrated" && m.weight >= 2).map((m) => `${f.title}: ${m.skillId} is ${m.state}`));
  const out = await callTool({
    userId,
    tool: "ask_followups",
    description: "Ask the few follow-up questions that would most change the evidence ledger.",
    schema: QuestionsSchema,
    model: MODEL_FAST,
    system: `Write 3 to 5 follow-up questions that would turn inferred or missing evidence into demonstrated evidence.
Each question must reference something specific from the person's history (a project, number or tool) and ask for scope, decisions owned, scale, or outcome.
One question per skill. Short, conversational, answerable in two or three sentences. "why" explains in one line what the answer unlocks.`,
    prompt: `Profile: ${profile?.summary}\nTarget: ${profile?.target}\n\nWeakest high-weight skills for the closest roles:\n${weak.join("\n")}\n\nLedger:\n${ledgerText(claims)}`,
    mock: () => ({
      questions: [
        { skillId: "stakeholder_mgmt", question: "When the 9 consultants disagreed, who made the final call and how did you resolve it?", why: "Turns coordination into evidence of decision ownership." },
        { skillId: "financial_analysis", question: "In the land feasibility studies, did you estimate revenue or returns, or only built-up area and cost?", why: "Decides whether financial analysis is demonstrated or still missing." },
        { skillId: "user_research", question: "How did you collect the buyer feedback that changed the unit mix?", why: "Could demonstrate user research for product roles." },
      ],
    }),
  });
  const db = await sql();
  await db`delete from questions where user_id = ${userId} and answer is null`;
  for (const q of out.questions) await db`insert into questions (user_id, skill_id, question, why) values (${userId}, ${q.skillId ?? null}, ${q.question}, ${q.why})`;
}

export async function applyAnswers(userId: string, answers: { id: string; answer: string }[]) {
  const qs = await getQuestions(userId);
  const claims = await getClaims(userId);
  const filled = answers.filter((a) => a.answer.trim().length > 0).map((a) => ({ q: qs.find((q) => q.id === a.id), answer: a.answer.trim().slice(0, 1500) })).filter((x) => x.q);
  if (!filled.length) throw new HttpError(400, "Answer at least one question first.");
  const answerText = filled.map((f) => `Q (${f.q!.skillId ?? "general"}): ${f.q!.question}\nA: ${f.answer}`).join("\n\n");

  const out = await callTool({
    userId,
    tool: "update_ledger",
    description: "Update the evidence ledger using the person's answers.",
    schema: AnswersSchema,
    model: MODEL_SMART,
    system: `Update capability claims using new answers. Skill ids:\n${SKILL_LIST}
- Upgrade a claim to demonstrated only if the answer gives a concrete specific. Quote the answer verbatim as evidence.
- Downgrade if the answer reveals the person did not actually do it (status inferred, evidence quotes the answer).
- Add new claims for capabilities the answers reveal. evidence must be a verbatim quote from an answer.
- Use the claim ids shown in brackets for updates.`,
    prompt: `Current ledger:\n${ledgerText(claims)}\n\nAnswers:\n${answerText}`,
    mock: () => ({ updates: claims.filter((c) => c.status === "inferred").slice(0, 1).map((c) => ({ claimId: c.id, status: "demonstrated" as const, evidence: filled[0].answer.slice(0, 80) })), newClaims: [] }),
  });

  const db = await sql();
  const ids = new Set(claims.map((c) => c.id));
  let changed = 0;
  for (const u of out.updates) {
    if (!ids.has(u.claimId)) continue;
    const ok = verifyQuote(u.evidence, answerText);
    await db`update claims set status = ${ok ? u.status : "inferred"}, evidence = ${u.evidence}, source = 'answer' where id = ${u.claimId} and user_id = ${userId}`;
    changed++;
  }
  for (const c of out.newClaims) {
    const ok = verifyQuote(c.evidence, answerText);
    await db`insert into claims (user_id, skill_id, label, status, evidence, source) values (${userId}, ${c.skillId}, ${c.label}, ${ok ? c.status : "inferred"}, ${c.evidence}, 'answer')`;
    changed++;
  }
  for (const f of filled) await db`update questions set answer = ${f.answer}, answered_at = now() where id = ${f.q!.id} and user_id = ${userId}`;
  await logEvent(userId, "answers", { answered: filled.length, changed });
  return { changed };
}

// ---------- 3. Role explanations (numbers come from the engine) ----------

export type RoleExplain = z.infer<typeof ExplainSchema>;

export async function explainRoles(userId: string) {
  const claims = await getClaims(userId);
  const profile = await getProfile(userId);
  const fits = rankRoles(claims).slice(0, 4);
  const facts = fits
    .map((f) => `${f.slug} | ${f.title} | coverage ${(f.coverage * 100).toFixed(0)}% | band ${f.band}\n  demonstrated: ${f.matches.filter((m) => m.state === "demonstrated").map((m) => m.label).join(", ") || "none"}\n  inferred: ${f.matches.filter((m) => m.state === "inferred").map((m) => m.label).join(", ") || "none"}\n  missing: ${f.matches.filter((m) => m.state === "missing").map((m) => m.label).join(", ") || "none"}\n  screens for: ${getRole(f.slug)!.screensFor.join("; ")}`)
    .join("\n");
  const out = await callTool({
    userId,
    tool: "explain_roles",
    description: "Explain role fits computed by the application.",
    schema: ExplainSchema,
    model: MODEL_SMART,
    system: `Explain each computed role fit for this person. Do not restate the percentage. Ground whyItFits in specific evidence from the ledger (name the project or number).
recruiterDoubt: the honest objection a recruiter in India would raise. firstProof: one piece of work to build, reusing a real past project.
outsideList: one adjacent role not in the list if the evidence strongly suggests it, else null. Return one entry per slug given, same slugs.`,
    prompt: `Profile: ${profile?.summary}\nTarget: ${profile?.target}\n\nComputed fits:\n${facts}\n\nLedger:\n${ledgerText(claims)}`,
    mock: () => ({
      roles: fits.map((f) => ({ slug: f.slug, ...(EXPLAIN[f.slug] ?? { whyItFits: `Mock explanation for ${f.title}.`, recruiterDoubt: "No title in this function yet.", firstProof: getRole(f.slug)!.proofIdea }) })),
      outsideList: { title: "Design-development manager at a developer", why: "Sits between architecture and development strategy, and uses your approvals and feasibility experience directly." },
    }),
  });
  await saveArtifact(userId, "role_explain", null, out);
  return out;
}

// ---------- 4. Plan ----------

export async function buildPlan(userId: string, roleSlug: string, routeType: RouteType) {
  const role = getRole(roleSlug);
  if (!role) throw new HttpError(400, "Unknown role.");
  const profile = await getProfile(userId);
  if (!profile) throw new HttpError(400, "Add your profile first.");
  const claims = await getClaims(userId);
  const fit = fitRole(role, claims);
  const route = computeRoutes(role, fit, profile.constraints).find((r) => r.type === routeType);
  if (!route) throw new HttpError(400, "That route is not available for this role.");
  if (routeType === "mba" && !profile.constraints.fullTimeStudyOk) {
    // still allowed, but the plan only covers preparation
  }
  const gaps = fit.matches.filter((m) => m.state !== "demonstrated").map((m) => `${m.skillId} (${m.state}, about ${Math.round(m.hoursToProof * (1 - m.strength))} hrs)`);
  const targetHours = routeType === "mba" ? 120 : route.studyHours + route.proofHours;

  const out = await callTool({
    userId,
    tool: "draft_plan",
    description: "Draft the ordered milestones for a career-transition plan.",
    schema: PlanSchema,
    model: MODEL_SMART,
    maxTokens: 4000,
    system: `Draft an ordered, realistic milestone list. The application schedules milestones into weeks; you only order them and estimate hours.
- Total hours should be close to the target given (within 15%). Each milestone 2 to 40 hours.
- Interleave learning with building; the first proof artefact should appear early, not at the end.
- Reuse the person's real projects as raw material for proof. Name them.
- End with apply and network steps specific to India (referrals, alumni, LinkedIn outreach to hiring managers, relevant job boards).
- For an MBA route, plan only the preparation phase (test prep, shortlisting, applications, essays), about 120 hours.
- If a course is part of the route, name it and split it into chunks.`,
    prompt: `Role: ${role.title}\nRoute: ${ROUTE_NAMES[routeType]}: ${route.summary}\nHours per week available: ${profile.constraints.hoursPerWeek}\nTarget total hours: ${targetHours}\nGaps to close: ${gaps.join("; ") || "none"}\nProof the role wants: ${role.proofIdea}\nPast projects: ${profile.projects.map((p) => `${p.name}: ${p.summary} (${p.scale})`).join(" | ")}\nProfile: ${profile.summary}`,
    mock: () => ({ note: "Proof comes early: the feasibility case starts in week 3 and doubles as interview material. Outreach starts once there is something to show.", milestones: JSON.parse(JSON.stringify(PLAN_CONSULTING)) }),
  });

  return savePlan(userId, roleSlug, routeType, out.milestones.map((m) => ({ ...m, skillId: m.skillId ?? undefined })), profile.constraints.hoursPerWeek, `Plan created for ${role.title} via ${ROUTE_NAMES[routeType].toLowerCase()}`, out.note, []);
}

type Done = { title: string; detail: string; hours: number; kind: string; skillId: string | null; output: string; note: string | null };

async function savePlan(userId: string, roleSlug: string, routeType: string, items: MilestoneInput[], hoursPerWeek: number, reason: string, note: string | null, done: Done[]) {
  const packed = packMilestones(items, hoursPerWeek);
  const db = await sql();
  return db.begin(async (tx) => {
    const v = (await tx`select coalesce(max(version), 0) + 1 as v from plans where user_id = ${userId}`)[0].v as number;
    await tx`update plans set active = false where user_id = ${userId}`;
    const plan = (await tx`insert into plans (user_id, role_slug, route_type, version, reason, hours_per_week, weeks, note) values (${userId}, ${roleSlug}, ${routeType}, ${v}, ${reason}, ${hoursPerWeek}, ${packed.weeks}, ${note}) returning id`)[0];
    let pos = 0;
    for (const d of done) {
      await tx`insert into milestones (plan_id, user_id, position, title, detail, hours, kind, skill_id, output, start_week, end_week, status, note) values (${plan.id}, ${userId}, ${pos++}, ${d.title}, ${d.detail}, ${d.hours}, ${d.kind}, ${d.skillId}, ${d.output}, 0, 0, 'done', ${d.note})`;
    }
    for (const m of packed.milestones) {
      await tx`insert into milestones (plan_id, user_id, position, title, detail, hours, kind, skill_id, output, start_week, end_week) values (${plan.id}, ${userId}, ${pos++}, ${m.title}, ${m.detail}, ${m.hours}, ${m.kind}, ${m.skillId ?? null}, ${m.output}, ${m.startWeek}, ${m.endWeek})`;
    }
    await tx`update profiles set selected_role = ${roleSlug}, selected_route = ${routeType} where user_id = ${userId}`;
    return { planId: plan.id as string, version: v, weeks: packed.weeks };
  });
}

// Deterministic re-plan: keep finished work, repack the rest with the new constraints.
export async function replanForConstraints(userId: string, before: Constraints, after: Constraints) {
  const active = await getActivePlan(userId);
  if (!active) return null;
  const changes: string[] = [];
  if (before.hoursPerWeek !== after.hoursPerWeek) changes.push(`hours ${before.hoursPerWeek} to ${after.hoursPerWeek}/week`);
  if (before.budgetInr !== after.budgetInr) changes.push(`budget changed`);
  if (before.fullTimeStudyOk !== after.fullTimeStudyOk) changes.push(after.fullTimeStudyOk ? "full-time study now possible" : "full-time study ruled out");
  if (before.maxPayCutPct !== after.maxPayCutPct || before.incomeFloorMonthly !== after.incomeFloorMonthly) changes.push("income limits changed");
  if (!changes.length) return null;
  const done = active.milestones.filter((m) => m.status === "done");
  const rest = active.milestones.filter((m) => m.status !== "done").map((m) => ({ title: m.title, detail: m.detail, hours: m.hours, kind: m.kind as MilestoneInput["kind"], skillId: m.skillId ?? undefined, output: m.output }));
  const role = getRole(active.plan.roleSlug)!;
  const claims = await getClaims(userId);
  const routes = computeRoutes(role, fitRole(role, claims), after);
  const current = routes.find((r) => r.type === active.plan.routeType);
  let note = `Repacked remaining ${rest.length} steps at ${after.hoursPerWeek} hrs/week.`;
  if (current && !current.feasible) note += ` Your current route now breaks a constraint (${current.flags[0]}). "${routes[0].name}" ranks first; consider switching on the Routes page.`;
  else if (routes[0].type !== active.plan.routeType) note += ` "${routes[0].name}" now ranks above your current route.`;
  return savePlan(userId, active.plan.roleSlug, active.plan.routeType, rest, after.hoursPerWeek, `Constraints changed: ${changes.join(", ")}`, note, done);
}

// ---------- 5. Proof Forge ----------

export type Brief = z.infer<typeof BriefSchema>;
export type Grade = z.infer<typeof GradeSchema>;

export async function makeBrief(userId: string, roleSlug: string) {
  const role = getRole(roleSlug);
  if (!role) throw new HttpError(400, "Unknown role.");
  const profile = await getProfile(userId);
  const claims = await getClaims(userId);
  const fit = fitRole(role, claims);
  const gaps = fit.matches.filter((m) => m.state !== "demonstrated").sort((a, b) => b.weight - a.weight).slice(0, 4);
  const out = await callTool({
    userId,
    tool: "write_brief",
    description: "Write a proof-of-capability project brief with a grading rubric.",
    schema: BriefSchema,
    model: MODEL_SMART,
    system: `Write one portfolio project brief that a hiring manager for the role would accept as evidence.
- Build it from the person's real past work (name the project) so they are not starting from zero.
- It must exercise the listed gap skills. Keep it doable in 15 to 40 hours.
- Use Indian context and public Indian data sources where data is needed.
- Rubric: one criterion per gap skill (use its skill id), with plain descriptions of strong, developing and absent work.`,
    prompt: `Role: ${role.title}. What the role wants as proof: ${role.proofIdea}\nGap skills: ${gaps.map((g) => `${g.skillId} (${g.state})`).join(", ")}\nPast projects: ${profile?.projects.map((p) => `${p.name}: ${p.summary} (${p.scale})`).join(" | ")}\nProfile: ${profile?.summary}`,
    mock: () => JSON.parse(JSON.stringify(BRIEF_CONSULTING)),
  });
  await saveArtifact(userId, "proof_brief", roleSlug, out);
  return out;
}

export async function gradeProof(userId: string, roleSlug: string, submission: string) {
  const brief = await getArtifact<Brief>(userId, "proof_brief", roleSlug);
  if (!brief) throw new HttpError(400, "Create a brief first.");
  const text = submission.trim().slice(0, 15000);
  if (text.length < 150) throw new HttpError(400, "Paste more of your work (at least a few paragraphs) so it can be assessed.");
  const out = await callTool({
    userId,
    tool: "grade_submission",
    description: "Grade a portfolio submission against its rubric.",
    schema: GradeSchema,
    model: MODEL_SMART,
    system: `Grade the submission strictly against the rubric, like a demanding hiring manager. Quote the submission as evidence (short, verbatim). Give one concrete fix per criterion.
ledgerUpdates: only for criteria graded strong (status demonstrated) or developing (status inferred). evidence must be a verbatim quote from the submission.`,
    prompt: `Brief: ${JSON.stringify(brief.payload)}\n\nSUBMISSION:\n${text}`,
    mock: () => ({
      overall: "developing" as const, summary: "Mock grade.",
      criteria: brief.payload.rubric.map((r) => ({ criterion: r.criterion, level: "developing" as const, evidence: text.slice(0, 40), fix: "Quantify the assumption." })),
      ledgerUpdates: brief.payload.rubric.slice(0, 1).map((r) => ({ skillId: r.skillId, status: "demonstrated" as const, label: `Proof: ${r.criterion}`, evidence: text.slice(0, 60) })),
    }),
  });
  const db = await sql();
  let added = 0;
  for (const u of out.ledgerUpdates) {
    const ok = verifyQuote(u.evidence, text);
    await db`insert into claims (user_id, skill_id, label, status, evidence, source) values (${userId}, ${u.skillId}, ${u.label}, ${ok ? u.status : "inferred"}, ${u.evidence}, 'user')`;
    added++;
  }
  await saveArtifact(userId, "proof_grade", roleSlug, { ...out, submittedChars: text.length });
  await logEvent(userId, "proof_graded", { role: roleSlug, overall: out.overall, added });
  return out;
}

// ---------- 6. Stall Doctor ----------

export type Diagnosis = z.infer<typeof DiagnoseSchema>;

export async function diagnose(userId: string, input: { applications: number; responses: number; interviews: number; channel: string; feedback: string }) {
  const profile = await getProfile(userId);
  const active = await getActivePlan(userId);
  if (!profile || !active) throw new HttpError(400, "Create a plan first, then check in.");
  const role = getRole(active.plan.roleSlug)!;
  const claims = await getClaims(userId);
  const fit = fitRole(role, claims);
  const done = active.milestones.filter((m) => m.status === "done").map((m) => m.title);
  const stuck = active.milestones.filter((m) => m.status === "stuck").map((m) => `${m.title}${m.note ? ` (${m.note})` : ""}`);
  const responseRate = input.applications ? ((input.responses / input.applications) * 100).toFixed(0) : "n/a";
  const out = await callTool({
    userId,
    tool: "diagnose_stall",
    description: "Diagnose why a career transition is stalling and propose next actions.",
    schema: DiagnoseSchema,
    model: MODEL_SMART,
    system: `Diagnose a stalled transition before recommending anything.
Order of suspicion: positioning and channel (how they apply, cold portals vs referrals, resume framing) and evidence quality come before skill gaps. A new paid course is the last resort and needs a clear skill-gap signal.
Use the funnel numbers: a very low response rate points to positioning, channel or role fit; interviews without offers point to evidence quality or interview skill.
Each action must be specific to this person's ledger and plan. Mark paid true only if it costs money.
suggestedRoute: only if keepRoute is false.`,
    prompt: `Target: ${role.title} via ${ROUTE_NAMES[active.plan.routeType as RouteType]}\nFit: ${(fit.coverage * 100).toFixed(0)}% weighted coverage, band ${fit.band}. Missing: ${fit.matches.filter((m) => m.state === "missing").map((m) => m.label).join(", ") || "none"}\nFunnel: ${input.applications} applications, ${input.responses} responses (${responseRate}%), ${input.interviews} interviews. Main channel: ${input.channel}\nFeedback or notes: ${input.feedback || "none"}\nCompleted steps: ${done.join("; ") || "none"}\nStuck steps: ${stuck.join("; ") || "none"}\nProfile: ${profile.summary}\nLedger:\n${ledgerText(claims)}`,
    mock: () => JSON.parse(JSON.stringify(DIAGNOSIS)),
  });

  await saveArtifact(userId, "diagnosis", role.slug, { ...out, input });
  await logEvent(userId, "checkin", { ...input });

  // Adapt the plan: insert the actions at the front of the remaining work.
  const doneMs = active.milestones.filter((m) => m.status === "done");
  const rest = active.milestones.filter((m) => m.status !== "done").map((m) => ({ title: m.title, detail: m.detail, hours: m.hours, kind: m.kind as MilestoneInput["kind"], skillId: m.skillId ?? undefined, output: m.output }));
  const actions: MilestoneInput[] = out.actions.map((a) => ({ title: a.title, detail: `${a.detail}${a.paid ? " (paid)" : ""}`, hours: a.hours, kind: a.kind, output: a.output }));
  const saved = await savePlan(userId, active.plan.roleSlug, active.plan.routeType, [...actions, ...rest], profile.constraints.hoursPerWeek, `Check-in: ${input.applications} applications, ${input.responses} responses`, out.verdict, doneMs);
  return { diagnosis: out, plan: saved };
}

// ---------- 7. Ask about this page ----------

export async function ask(userId: string, question: string, page: string) {
  const profile = await getProfile(userId);
  const claims = await getClaims(userId);
  const active = await getActivePlan(userId);
  const fits = rankRoles(claims).slice(0, 4).map((f) => `${f.title}: ${(f.coverage * 100).toFixed(0)}% (${f.band})`).join("; ");
  let routes = "";
  if (active) {
    const role = getRole(active.plan.roleSlug)!;
    routes = computeRoutes(role, fitRole(role, claims), profile!.constraints)
      .map((r) => `${r.name}: ${r.months.base} months base, Rs ${r.cashInr} cash, Rs ${r.incomeLossInr} income loss, flags: ${r.flags.join(" / ") || "none"}`)
      .join("\n");
  }
  return callText({
    userId,
    model: MODEL_FAST,
    system: `Answer questions about the person's own transition analysis in under 150 words. Use only the context given. If the answer needs data the app does not have (salaries at a specific company, hiring chances), say so plainly and suggest how to find out. Plain text, no markdown headers.`,
    prompt: `Page: ${page}\nProfile: ${profile?.summary}\nConstraints: ${JSON.stringify(profile?.constraints)}\nRole fits: ${fits}\nCurrent plan: ${active ? `${active.plan.roleSlug} via ${active.plan.routeType}, ${active.plan.weeks} weeks` : "none"}\nRoutes:\n${routes}\nLedger:\n${ledgerText(claims)}\n\nQuestion: ${question.slice(0, 600)}`,
    mock: () => "Mock answer: this comes from your ledger and routes.",
  });
}

// ---------- mock helpers (local tests only) ----------

function mockExtract(resume: string) {
  const lines = resume.split("\n").map((l) => l.replace(/^[-\s]+/, "").trim()).filter((l) => l.length > 30);
  const pick = (re: RegExp) => lines.find((l) => re.test(l)) ?? lines[0];
  return {
    name: resume.split("\n")[0].trim().slice(0, 40) || null,
    currentRole: "Mock role",
    yearsExperience: 4,
    city: "Pune",
    summary: "Mock summary of the resume for local testing.",
    projects: [{ name: "Mock project", summary: "From resume", scale: "2 towers" }],
    claims: [
      { skillId: "stakeholder_mgmt" as const, label: "Coordinated consultants", status: "demonstrated" as const, evidence: pick(/coordinat/i) },
      { skillId: "budget_management" as const, label: "Owned a budget", status: "demonstrated" as const, evidence: pick(/budget/i) },
      { skillId: "process_improvement" as const, label: "Cut approval cycle", status: "demonstrated" as const, evidence: pick(/cut|reduc/i) },
      { skillId: "excel_modelling" as const, label: "Excel tracker", status: "demonstrated" as const, evidence: pick(/excel/i) },
      { skillId: "user_research" as const, label: "Buyer feedback", status: "inferred" as const, evidence: pick(/feedback|interview/i) },
      { skillId: "presentation_storytelling" as const, label: "Client presentations", status: "inferred" as const, evidence: pick(/present/i) },
      { skillId: "domain_real_estate" as const, label: "Feasibility studies", status: "demonstrated" as const, evidence: pick(/feasib/i) },
    ],
  };
}

export { skillLabel };
