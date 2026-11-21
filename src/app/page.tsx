import Link from "next/link";
import { Logo } from "@/components/Logo";
import { RouteMapHero } from "@/components/RouteMapHero";
import { StartButtons } from "@/components/StartButtons";
import { Hero } from "@/components/landing/Hero";
import { Crossing } from "@/components/landing/Crossing";
import { StoryMarquee } from "@/components/landing/StoryMarquee";
import { TextReveal } from "@/components/vendor/text-reveal";
import { getUserId } from "@/lib/auth";

export default async function Home() {
  const signedIn = !!(await getUserId().catch(() => null));
  return (
    <div className="bg-night">
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between text-white">
          <Logo />
          <nav className="flex items-center gap-1 text-sm">
            <Link className="btn text-cable/80 hover:text-white px-3" href="/method">How it works</Link>
            <Link className="btn text-cable/80 hover:text-white px-3 hidden sm:inline-flex" href="/stories">Switch stories</Link>
            <Link className="btn border border-white/30 hover:border-white" href={signedIn ? "/app" : "/login"}>{signedIn ? "Workspace" : "Sign in"}</Link>
          </nav>
        </div>
      </header>

      <main>
        <Hero signedIn={signedIn} />

        <section className="bg-night text-white" aria-label="The problem">
          <TextReveal className="h-[220vh]">Seven in ten Indian professionals are looking for a new role. A course is one search away. What nobody tells them is which route is worth a year of their life.</TextReveal>
          <p className="max-w-4xl mx-auto px-9 md:px-12 pb-24 -mt-[30vh] relative text-sm text-cable/60">LinkedIn India Job Outlook 2026, reported by The Indian Express: 72% seeking a role change, 84% feeling unprepared. A role change is not always a career switch.</p>
        </section>

        <Crossing />

        <section className="bg-sheet border-y border-rule" aria-labelledby="routes-title">
          <div className="max-w-[1240px] mx-auto px-5 py-24 grid lg:grid-cols-[0.8fr_1.2fr] gap-12 items-center">
            <div>
              <h2 id="routes-title" className="text-[clamp(2.2rem,5vw,4rem)] font-extrabold tracking-[-0.04em]">One profile, several ways across.</h2>
              <p className="serif text-xl text-graphite mt-5 max-w-md">An architect rarely needs to start over. A process case, a year in a founder&apos;s office, or a fellowship with two case studies can each get there, at very different costs. Bridgework shows all of them side by side.</p>
            </div>
            <RouteMapHero />
          </div>
        </section>

        <StoryMarquee />

        <section className="bg-paper" aria-labelledby="honest-title">
          <div className="max-w-[1240px] mx-auto px-5 py-24 grid lg:grid-cols-2 gap-12">
            <h2 id="honest-title" className="text-[clamp(2.2rem,5vw,4rem)] font-extrabold tracking-[-0.04em] max-w-[13ch]">What it will not tell you.</h2>
            <ul className="divide-y divide-rule border-y border-rule">
              {[
                ["Your odds of being hired.", "No dataset exists to estimate that honestly for Indian career changers, so fit is shown as evidence coverage with the rule visible."],
                ["Numbers it made up.", "The AI reads, asks, explains and grades. Every cost, timeline and score is calculated by code you can inspect on the method page."],
                ["To buy a course.", "Free routes rank first when they are as good. Every price shows its source and the date it was checked."],
              ].map(([t, d]) => (
                <li key={t} className="py-6"><p className="text-xl font-bold">{t}</p><p className="serif text-lg text-graphite mt-1">{d}</p></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-night text-white" aria-labelledby="cta-title">
          <div className="max-w-[1240px] mx-auto px-5 py-28">
            <h2 id="cta-title" className="text-[clamp(2.4rem,6vw,5rem)] font-extrabold tracking-[-0.045em] max-w-[14ch]">Start from what you have already done.</h2>
            <p className="serif text-xl text-cable/80 mt-5 max-w-lg">Use a sample profile or your own resume. It takes about a minute to see your ledger.</p>
            <div className="mt-10"><StartButtons signedIn={signedIn} dark /></div>
          </div>
        </section>
      </main>

      <footer className="bg-night border-t border-white/10 text-cable/60 text-sm">
        <div className="max-w-[1240px] mx-auto px-5 py-8 flex flex-wrap gap-6 justify-between">
          <span>Built for the Agentic AI Hackathon, Nov 2026. Sample profiles are fictional.</span>
          <span className="flex gap-4"><Link className="hover:text-white" href="/method">Method and sources</Link><Link className="hover:text-white" href="/stories">Switch stories</Link></span>
        </div>
      </footer>
    </div>
  );
}
