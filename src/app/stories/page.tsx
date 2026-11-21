import { PublicHeader } from "@/components/PublicHeader";
import { STORIES } from "@/lib/data/stories";

export const metadata = { title: "Career switch stories" };

export default function Stories() {
  const stalled = STORIES.filter((s) => s.outcome !== "switched").length;
  return (
    <div>
      <PublicHeader />
      <main className="max-w-5xl mx-auto px-5 pb-20">
        <h1 className="text-4xl sm:text-5xl font-semibold mt-6">How people actually switched</h1>
        <p className="text-lg text-graphite mt-4 max-w-3xl">{STORIES.length} publicly reported transitions, {stalled} of which stalled or hit a wall first. Read them as illustrations of mechanisms, not odds: most come from training providers, who publish their successes.</p>
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          {STORIES.map((s) => (
            <article key={s.person + s.to} className="sheet p-5">
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{s.person}</h2>{s.outcome !== "switched" && <span className="chip border-alert text-alert">{s.outcome}</span>}<span className="chip">{s.region}</span></div>
              <p className="mt-1">{s.from} <span className="text-graphite">to</span> {s.to}</p>
              <p className="text-sm text-graphite mt-2">{s.mechanism.join(", ")}</p>
              <p className="mt-2 text-[0.95rem]">{s.lesson}</p>
              <p className="hint mt-3">{s.sourceType}: {s.url ? <a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.source}</a> : s.source}</p>
            </article>
          ))}
        </div>
        <p className="hint mt-8">What these stories share: in almost every case the decisive step was visible proof of work or an intermediate role, not a credential alone. That pattern is why Bridgework builds plans around proof and bridge roles.</p>
      </main>
    </div>
  );
}
