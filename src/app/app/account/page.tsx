import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getEvents } from "@/lib/store";
import { AccountActions } from "@/components/AccountActions";
import { PROVIDER, PROVIDER_LABEL } from "@/lib/ai";

const TOOL: Record<string, string> = { record_profile: "Read resume into ledger", ask_followups: "Wrote follow-up questions", update_ledger: "Updated ledger from answers", explain_roles: "Explained role fits", draft_plan: "Drafted plan", write_brief: "Wrote proof brief", grade_submission: "Graded proof", diagnose_stall: "Diagnosed check-in", ask: "Answered a question" };

export default async function AccountPage() {
  const user = await requireUser();
  const calls = await getEvents(user.id, "ai_call");
  const inTok = calls.reduce((s, c) => s + Number(c.payload.inTok || 0), 0);
  const outTok = calls.reduce((s, c) => s + Number(c.payload.outTok || 0), 0);
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-4xl font-semibold">Account and data</h1>
        <p className="text-graphite mt-2">{user.isGuest ? "You are using a guest account on this browser." : `Signed in as ${user.email}.`}</p>
        {user.isGuest && <Link href="/signup" className="btn btn-primary mt-4">Save my work to an account</Link>}
      </div>
      <section className="sheet p-6">
        <h2 className="text-xl font-semibold">Your data</h2>
        <p className="text-graphite text-sm mt-1 mb-4">Your resume, ledger, plans and check-ins are stored to run this service and nowhere else. Resume text is sent to {PROVIDER_LABEL} for analysis.{PROVIDER === "gemini" ? " This deployment uses Google's free tier, under which Google may use prompts to improve its products, so remove phone numbers, addresses and anything private before you paste." : ""}</p>
        <AccountActions />
      </section>
      <section className="sheet p-6">
        <h2 className="text-xl font-semibold">What the AI did for you</h2>
        <p className="text-graphite text-sm mt-1">Every model call, so you can see where AI was used and where calculations were not. {calls.length} calls, {inTok.toLocaleString("en-IN")} input and {outTok.toLocaleString("en-IN")} output tokens.</p>
        {calls.length ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm min-w-[480px]">
              <thead><tr className="text-left text-graphite"><th className="py-2 font-medium">When</th><th className="py-2 font-medium">Task</th><th className="py-2 font-medium">Model</th><th className="py-2 font-medium text-right">Seconds</th></tr></thead>
              <tbody>{calls.map((c, i) => <tr key={i} className="border-t border-rule"><td className="py-2">{new Date(c.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td className="py-2">{TOOL[String(c.payload.tool)] ?? String(c.payload.tool)}</td><td className="py-2">{String(c.payload.model)}</td><td className="py-2 text-right tabular-nums">{(Number(c.payload.ms) / 1000).toFixed(1)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="mt-3 text-sm">No AI calls yet.</p>}
      </section>
    </div>
  );
}
