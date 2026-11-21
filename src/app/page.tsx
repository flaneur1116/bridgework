import Link from "next/link";
import { Logo } from "@/components/Logo";
import { StartButtons } from "@/components/StartButtons";
import { Hero } from "@/components/landing/Hero";
import { Crossing } from "@/components/landing/Crossing";
import { StoryMarquee } from "@/components/landing/StoryMarquee";
import { TextReveal } from "@/components/vendor/text-reveal";
import { getUserId } from "@/lib/auth";

export default async function Home() {
  const signedIn = !!(await getUserId().catch(() => null));
  return (
    <div className="bg-night text-cable">
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
          <TextReveal className="h-[200vh]">72% of Indian professionals want a new role. 84% feel unprepared. Courses are everywhere. Clarity is not.</TextReveal>
          <p className="max-w-4xl mx-auto px-9 md:px-12 pb-24 -mt-[30vh] relative text-sm text-cable/50">LinkedIn India Job Outlook 2026, via The Indian Express</p>
        </section>

        <Crossing />

        <StoryMarquee />

        <section className="bg-night text-white" aria-labelledby="cta-title">
          <div className="max-w-[1240px] mx-auto px-5 py-28">
            <h2 id="cta-title" className="text-[clamp(2.4rem,6vw,5rem)] font-extrabold tracking-[-0.045em] max-w-[14ch]">Start from what you have already done.</h2>
            <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-cable/70"><li>No hiring odds</li><li>No made-up numbers</li><li>No course upsell</li></ul>
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
