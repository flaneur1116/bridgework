import { PublicHeader } from "@/components/PublicHeader";
import { LEARNING, USD_INR_ASSUMPTION } from "@/lib/data/learning";
import { BAND_RULES, PLAN_CAPACITY, fmtInr } from "@/lib/engine";
import { ROLES } from "@/lib/data/roles";

export const metadata = { title: "How Bridgework works" };

export default function Method() {
  return (
    <div>
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-5 pb-20">
        <h1 className="text-4xl sm:text-5xl font-semibold mt-6">How it works, and what it cannot do</h1>
        <p className="text-lg text-graphite mt-4">Bridgework splits the work between a language model and plain code. The model reads, asks, explains, plans and grades. Code does every calculation, so the numbers are repeatable and you can check them.</p>

        <h2 className="text-2xl font-semibold mt-12">Where the AI is used</h2>
        <ul className="mt-4 space-y-3">
          <li><strong className="font-semibold">Reading your resume.</strong> The model (Google Gemini on the free tier in this deployment; Anthropic Claude is also supported) maps your experience onto 38 capabilities and quotes the exact line behind each. We then check every quote against your resume text; if it is not there, the claim is downgraded to assumed and flagged.</li>
          <li><strong className="font-semibold">Follow-up questions.</strong> It asks only about assumed or missing skills that matter most for your closest roles. Your answers can upgrade evidence, again only with a verbatim quote.</li>
          <li><strong className="font-semibold">Explaining fits, drafting plans, writing proof briefs.</strong> Built from your real projects, not generic templates.</li>
          <li><strong className="font-semibold">Grading proof.</strong> Against a visible rubric. Strong work becomes proven evidence in your ledger.</li>
          <li><strong className="font-semibold">Check-in diagnosis.</strong> Positioning and application channel are examined before skill gaps; paid courses are a last resort.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-12">How the numbers are calculated</h2>
        <ul className="mt-4 space-y-3 text-[0.98rem]">
          <li><strong className="font-semibold">Evidence strength.</strong> Proven skill counts 1, an assumed skill you confirmed 0.75, an unconfirmed assumption 0.4, a rejected one 0.</li>
          <li><strong className="font-semibold">Coverage.</strong> Each role card weights 7 to 10 skills. Coverage is the weighted share backed by evidence.</li>
          <li><strong className="font-semibold">Bands.</strong> {BAND_RULES}</li>
          <li><strong className="font-semibold">Hours.</strong> Each role skill has an estimated number of hours to build proof of it. Your gap hours are those hours times the missing strength. Routes add course hours and proof-project hours.</li>
          <li><strong className="font-semibold">Time to offer.</strong> Hours divided by your weekly hours, plus a 15% buffer, plus job-search months for the route. Optimistic runs 20% faster with one month less search; conservative runs 40% slower with three more.</li>
          <li><strong className="font-semibold">Money.</strong> Cash outlay from sourced prices, plus income lost (a year of CTC for a full-time MBA; the assumed pay cut for a year in a bridge role). USD prices use Rs {USD_INR_ASSUMPTION} per dollar.</li>
          <li><strong className="font-semibold">Plans.</strong> Milestones are scheduled into {Math.round(PLAN_CAPACITY * 100)}% of your weekly hours, keeping the rest as buffer. When your hours change, unfinished steps are rescheduled and the change is logged as a new version.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-12">Prices and their sources</h2>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm min-w-[560px]">
            <thead><tr className="text-left text-graphite"><th className="py-2 font-medium">Option</th><th className="py-2 font-medium">Planning cost</th><th className="py-2 font-medium">Source</th></tr></thead>
            <tbody>{Object.values(LEARNING).filter((l) => l.kind !== "free").map((l) => (
              <tr key={l.id} className="border-t border-rule align-top"><td className="py-2 pr-3">{l.name}<span className="block hint">{l.costNote}</span></td><td className="py-2 pr-3 whitespace-nowrap">Rs {fmtInr(l.costInr)}</td><td className="py-2"><a className="underline" href={l.source.url} target="_blank" rel="noreferrer">{l.source.label}</a><span className="block hint">{l.source.quality}, checked {l.source.checked}</span></td></tr>
            ))}</tbody>
          </table>
        </div>

        <h2 className="text-2xl font-semibold mt-12">Known limits</h2>
        <ul className="mt-4 space-y-2 list-disc pl-5">
          <li>The eight role cards ({ROLES.map((r) => r.title).join(", ")}) are curated demo data. Skill weights, hour estimates and salary ranges are planning assumptions, not measured values.</li>
          <li>There is no live job-posting feed yet. Market demand is not part of the score.</li>
          <li>Time-to-offer ranges are planning estimates, not forecasts. No dataset exists yet to calibrate them for Indian career changers.</li>
          <li>We never estimate your chance of being hired. We do not have data to do it honestly.</li>
          <li>The sample profiles are fictional.</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-12">The research behind it</h2>
        <p className="mt-3 text-graphite">The product brief was built from a desk-research report (Nov 2026) drawing on LinkedIn&apos;s India Job Outlook and Economic Graph, NIIT&apos;s India Skills Gap Report 2026, OECD adult-learning data, the WEF Future of Jobs Report 2025 and MDRC&apos;s evaluation of AI career navigation. The clearest lesson came from MDRC: a standalone chatbot reduced how many options people saw. So Bridgework is a workspace you can browse, with AI inside each step rather than a chat window in front of it.</p>
      </main>
    </div>
  );
}
