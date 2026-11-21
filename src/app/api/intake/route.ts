import { z } from "zod";
import { handle } from "@/lib/route";
import { apiUser, HttpError } from "@/lib/auth";
import { analyseResume } from "@/lib/agents";
import { DEFAULT_CONSTRAINTS, PERSONAS } from "@/lib/data/personas";

export const maxDuration = 120;

const Constraints = z.object({
  hoursPerWeek: z.number().min(1).max(60),
  budgetInr: z.number().min(0).max(10000000),
  currentCtcLpa: z.number().min(0).max(500),
  incomeFloorMonthly: z.number().min(0).max(10000000),
  fullTimeStudyOk: z.boolean(),
  canRelocate: z.boolean(),
  maxPayCutPct: z.number().min(0).max(100),
});

export const POST = handle(async (req) => {
  const user = await apiUser();
  const form = await req.formData();
  const personaId = (form.get("personaId") as string) || null;
  const persona = PERSONAS.find((p) => p.id === personaId);
  let resumeText = (form.get("resumeText") as string) || "";
  const file = form.get("file");
  if (persona) resumeText = persona.resume;
  else if (file && typeof file !== "string" && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) throw new HttpError(400, "That PDF is over 5 MB. Upload a smaller file or paste the text.");
    if (!file.name.toLowerCase().endsWith(".pdf")) throw new HttpError(400, "Upload a PDF, or paste your resume as text.");
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const { text } = await extractText(pdf, { mergePages: true });
    resumeText = String(text);
    if (resumeText.trim().length < 200) throw new HttpError(400, "We could not read text from that PDF (it may be a scanned image). Paste the text instead.");
  }
  const constraints = Constraints.parse(JSON.parse((form.get("constraints") as string) || JSON.stringify(persona?.constraints ?? DEFAULT_CONSTRAINTS)));
  const target = ((form.get("target") as string) || persona?.target || "").slice(0, 300);
  return analyseResume(user.id, { resumeText, personaId, target, constraints });
});
