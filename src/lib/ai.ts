import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SKILL_IDS, SKILLS } from "./data/skills";
import { HttpError } from "./auth";
import { sql } from "./db";

// Provider: Google Gemini (free tier, no card) when GEMINI_API_KEY is set; Anthropic when ANTHROPIC_API_KEY is set.
export const PROVIDER: "gemini" | "anthropic" | "none" = process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "anthropic" : "none";
const GEMINI_SMART = [process.env.AI_MODEL_SMART, "gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"].filter(Boolean) as string[];
const GEMINI_FAST = [process.env.AI_MODEL_FAST, "gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-flash-latest"].filter(Boolean) as string[];
export const MODEL_SMART = "smart";
export const MODEL_FAST = "fast";
const ANTHROPIC_MODELS = { smart: process.env.AI_MODEL_SMART || "claude-sonnet-5-5", fast: process.env.AI_MODEL_FAST || "claude-haiku-5-5" };
export const MOCK = process.env.AI_MOCK === "1" && process.env.NODE_ENV !== "production";
export const PROVIDER_LABEL = MOCK ? "local fixtures" : PROVIDER === "gemini" ? "Google Gemini" : PROVIDER === "anthropic" ? "Anthropic Claude" : "not configured";

let _client: Anthropic | null = null;
function anthropic() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, baseURL: process.env.ANTHROPIC_API_BASE || undefined });
  return _client;
}

const SKILL_LIST = SKILL_IDS.map((id) => `${id}: ${SKILLS[id].label}`).join("\n");

const HOUSE_RULES = `You are the analysis engine inside Bridgework, a career-transition planner for working professionals in India.
Rules that override everything else:
- Never invent facts about the person. Only use what is in their resume, answers or submitted work.
- Never give a probability of getting hired, an offer likelihood or a guaranteed salary.
- Do not compute costs, timelines or scores; the application does that. You explain and plan.
- Prefer free and low-cost actions. Recommend paid courses only when free routes clearly cannot close the gap.
- Write plainly and specifically, in British-Indian English. No hype, no em dashes.`;

// Gemini accepts a JSON-schema subset: turn Zod's anyOf-with-null into an optional field and drop unknown keys.
type J = Record<string, unknown>;
function forGemini(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(forGemini);
  if (!node || typeof node !== "object") return node;
  const n = { ...(node as J) };
  if (Array.isArray(n.anyOf)) {
    const nonNull = (n.anyOf as J[]).filter((x) => x.type !== "null");
    if (nonNull.length === 1) return forGemini({ ...nonNull[0], ...(n.description ? { description: n.description } : {}) });
  }
  const keep = ["type", "description", "properties", "required", "items", "enum", "minimum", "maximum", "minItems", "maxItems", "format", "title"];
  const out: J = {};
  for (const k of keep) if (k in n) out[k] = n[k];
  if (out.properties) {
    const props: J = {};
    const req = new Set((out.required as string[]) ?? []);
    for (const [k, v] of Object.entries(out.properties as J)) {
      const vv = v as J;
      if (Array.isArray(vv.anyOf) && (vv.anyOf as J[]).some((x) => x.type === "null")) req.delete(k);
      props[k] = forGemini(v);
    }
    out.properties = props;
    out.required = [...req];
  }
  if (out.items) out.items = forGemini(out.items);
  return out;
}

class ProviderError extends Error {
  constructor(public status: number, public body: string) { super(body); }
}

async function gemini(model: string, system: string, prompt: string, schema: unknown | null, maxTokens: number) {
  const gen: J = { maxOutputTokens: maxTokens, temperature: 0.4 };
  const variants: J[] = schema
    ? [{ ...gen, responseFormat: { text: { mimeType: "application/json", schema } } }, { ...gen, responseMimeType: "application/json", responseJsonSchema: schema }]
    : [gen];
  let last: ProviderError | null = null;
  for (const g of variants) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: g }),
    });
    const body = await res.text();
    if (res.ok) {
      const data = JSON.parse(body);
      const text = (data.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
      return { text, inTok: data.usageMetadata?.promptTokenCount ?? 0, outTok: data.usageMetadata?.candidatesTokenCount ?? 0 };
    }
    last = new ProviderError(res.status, body);
    // Only retry with the legacy field names when the request shape itself was rejected.
    if (!(res.status === 400 && /responseFormat|Unknown name|Invalid JSON payload/i.test(body))) break;
  }
  throw last!;
}

async function geminiAny(tier: "smart" | "fast", system: string, prompt: string, schema: unknown | null, maxTokens: number) {
  const models = tier === "smart" ? GEMINI_SMART : GEMINI_FAST;
  let last: unknown = null;
  for (const m of [...new Set(models)]) {
    try {
      return { ...(await gemini(m, system, prompt, schema, maxTokens)), model: m };
    } catch (e) {
      last = e;
      // Free-tier models are often overloaded (503) or rate limited (429): move on to the next model.
      if (e instanceof ProviderError && ([404, 429, 500, 503].includes(e.status) || (e.status === 400 && /not found|not supported/i.test(e.body)))) {
        console.warn(`Gemini ${m} failed with ${e.status}, trying next model`);
        continue;
      }
      break;
    }
  }
  throw last;
}

function mapError(e: unknown): never {
  if (e instanceof HttpError) throw e;
  const status = (e as { status?: number }).status;
  if (status === 401 || status === 403) throw new HttpError(503, "The AI key on the server was rejected. Check the API key in your deployment settings.");
  if (status === 429 || status === 503) throw new HttpError(503, "The free AI models are busy right now. Wait a minute and try again.");
  if (e instanceof ProviderError) console.error("AI provider error", e.status, e.body.slice(0, 500));
  else console.error(e);
  throw new HttpError(502, "The AI service did not respond. Try again in a moment.");
}

type CallOpts<T extends z.ZodType> = {
  tool: string;
  description: string;
  schema: T;
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  userId?: string;
  mock: () => z.infer<T>;
};

export async function callTool<T extends z.ZodType>(o: CallOpts<T>): Promise<z.infer<T>> {
  const tier = o.model === MODEL_FAST ? "fast" : "smart";
  const started = Date.now();
  if (MOCK) {
    const out = o.schema.parse(o.mock());
    await logCall(o.userId, o.tool, "mock", Date.now() - started, 0, 0);
    return out;
  }
  if (PROVIDER === "none") throw new HttpError(503, "AI is not configured: set GEMINI_API_KEY (free) or ANTHROPIC_API_KEY on the server.");
  const json = z.toJSONSchema(o.schema, { target: "draft-7" }) as J;
  delete json.$schema;
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = attempt === 0 ? o.prompt : `${o.prompt}\n\nYour previous output failed validation: ${lastErr}. Return valid output.`;
    let raw: unknown = null;
    try {
      if (PROVIDER === "gemini") {
        const r = await geminiAny(tier, `${HOUSE_RULES}\n\n${o.system}\n\nTask: ${o.description}`, prompt, forGemini(json), (o.maxTokens ?? 4000) + 2000);
        await logCall(o.userId, o.tool, r.model, Date.now() - started, r.inTok, r.outTok);
        try { raw = JSON.parse(r.text.replace(/^```(?:json)?\s*|\s*```$/g, "")); } catch { raw = null; }
      } else {
        const model = ANTHROPIC_MODELS[tier];
        const res = await anthropic().messages.create({
          model,
          max_tokens: o.maxTokens ?? 4000,
          system: `${HOUSE_RULES}\n\n${o.system}`,
          tools: [{ name: o.tool, description: o.description, input_schema: json as Anthropic.Tool.InputSchema }],
          tool_choice: { type: "tool", name: o.tool },
          messages: [{ role: "user", content: prompt }],
        });
        await logCall(o.userId, o.tool, model, Date.now() - started, res.usage.input_tokens, res.usage.output_tokens);
        const block = res.content.find((b) => b.type === "tool_use");
        raw = block && "input" in block ? block.input : null;
      }
    } catch (e) {
      mapError(e);
    }
    const parsed = o.schema.safeParse(raw);
    if (parsed.success) return parsed.data;
    lastErr = raw === null ? "output was not valid JSON" : parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  }
  throw new HttpError(502, "The AI returned an answer we could not use. Try again.");
}

export async function callText(o: { system: string; prompt: string; userId?: string; model?: string; mock: () => string }): Promise<string> {
  const started = Date.now();
  if (MOCK) {
    await logCall(o.userId, "ask", "mock", 0, 0, 0);
    return o.mock();
  }
  if (PROVIDER === "none") throw new HttpError(503, "AI is not configured: set GEMINI_API_KEY (free) or ANTHROPIC_API_KEY on the server.");
  try {
    if (PROVIDER === "gemini") {
      const r = await geminiAny("fast", `${HOUSE_RULES}\n\n${o.system}`, o.prompt, null, 1200);
      await logCall(o.userId, "ask", r.model, Date.now() - started, r.inTok, r.outTok);
      return r.text.trim();
    }
    const model = ANTHROPIC_MODELS.fast;
    const res = await anthropic().messages.create({ model, max_tokens: 900, system: `${HOUSE_RULES}\n\n${o.system}`, messages: [{ role: "user", content: o.prompt }] });
    await logCall(o.userId, "ask", model, Date.now() - started, res.usage.input_tokens, res.usage.output_tokens);
    return res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  } catch (e) {
    mapError(e);
  }
}

async function logCall(userId: string | undefined, tool: string, model: string, ms: number, inTok: number, outTok: number) {
  if (!userId) return;
  try {
    const db = await sql();
    await db`insert into events (user_id, type, payload) values (${userId}, 'ai_call', ${db.json({ tool, model, ms, inTok, outTok })})`;
  } catch {
    /* logging must never break the request */
  }
}

// ---------------- Schemas ----------------

const SkillEnum = z.enum(SKILL_IDS as [string, ...string[]]);

export const ExtractSchema = z.object({
  name: z.string().nullish(),
  currentRole: z.string(),
  yearsExperience: z.number(),
  city: z.string().nullish(),
  summary: z.string().describe("Two plain sentences describing the person's work, no praise."),
  projects: z.array(z.object({ name: z.string(), summary: z.string(), scale: z.string() })).max(5),
  claims: z
    .array(
      z.object({
        skillId: SkillEnum,
        label: z.string().describe("The capability in the person's own context, under 12 words"),
        status: z.enum(["demonstrated", "inferred"]),
        evidence: z.string().describe("Verbatim quote from the resume, copied exactly"),
      })
    )
    .min(4)
    .max(24),
});

export const QuestionsSchema = z.object({
  questions: z.array(z.object({ skillId: SkillEnum.nullish(), question: z.string(), why: z.string() })).min(2).max(5),
});

export const AnswersSchema = z.object({
  updates: z.array(z.object({ claimId: z.string(), status: z.enum(["demonstrated", "inferred"]), evidence: z.string() })),
  newClaims: z.array(z.object({ skillId: SkillEnum, label: z.string(), status: z.enum(["demonstrated", "inferred"]), evidence: z.string() })),
});

export const ExplainSchema = z.object({
  roles: z.array(
    z.object({
      slug: z.string(),
      whyItFits: z.string(),
      recruiterDoubt: z.string().describe("The single thing a recruiter for this role will doubt about this profile"),
      firstProof: z.string().describe("The first piece of proof to build, tied to the person's real past work"),
    })
  ),
  outsideList: z
    .object({ title: z.string(), why: z.string() })
    .nullish()
    .describe("One adjacent role outside the curated list worth exploring, or null"),
});

export const PlanSchema = z.object({
  note: z.string().describe("Two sentences on how this plan is sequenced and why"),
  milestones: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        hours: z.number().min(1).max(60),
        kind: z.enum(["learn", "build", "apply", "network"]),
        skillId: SkillEnum.nullish(),
        output: z.string().describe("The concrete artefact or evidence this step produces"),
      })
    )
    .min(5)
    .max(12),
});

export const BriefSchema = z.object({
  title: z.string(),
  context: z.string().describe("Which real past project or experience this builds on and why"),
  task: z.string(),
  deliverables: z.array(z.string()).min(2).max(6),
  timeboxHours: z.number(),
  rubric: z
    .array(z.object({ criterion: z.string(), skillId: SkillEnum, strong: z.string(), developing: z.string(), absent: z.string() }))
    .min(3)
    .max(6),
});

export const GradeSchema = z.object({
  overall: z.enum(["strong", "developing", "absent"]),
  summary: z.string(),
  criteria: z.array(
    z.object({ criterion: z.string(), level: z.enum(["strong", "developing", "absent"]), evidence: z.string().describe("Short quote from the submission, or 'none'"), fix: z.string() })
  ),
  ledgerUpdates: z.array(z.object({ skillId: SkillEnum, status: z.enum(["demonstrated", "inferred"]), label: z.string(), evidence: z.string() })),
});

export const DiagnoseSchema = z.object({
  verdict: z.string().describe("Two sentences: the most likely reason it is stalling and what to change"),
  hypotheses: z
    .array(
      z.object({
        cause: z.enum(["role_fit", "evidence_quality", "positioning", "channel", "volume", "skill_gap", "constraint"]),
        confidence: z.enum(["high", "medium", "low"]),
        reasoning: z.string(),
      })
    )
    .min(2)
    .max(5),
  keepRoute: z.boolean(),
  suggestedRoute: z.enum(["direct", "bridge", "upskill", "mba"]).nullish(),
  actions: z
    .array(z.object({ title: z.string(), detail: z.string(), hours: z.number().min(1).max(30), kind: z.enum(["learn", "build", "apply", "network"]), paid: z.boolean(), output: z.string() }))
    .min(2)
    .max(5),
});

export { SKILL_LIST };
