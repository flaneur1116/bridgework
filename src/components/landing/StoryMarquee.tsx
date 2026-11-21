import Link from "next/link";
import { Marquee } from "../vendor/marquee";
import { STORIES } from "@/lib/data/stories";

export function StoryMarquee() {
  const half = Math.ceil(STORIES.length / 2);
  const row = (items: typeof STORIES, reverse?: boolean) => (
    <Marquee pauseOnHover reverse={reverse} className="[--duration:70s] [--gap:1rem]">
      {items.map((s) => (
        <figure key={s.person + s.to} className="w-[300px] shrink-0 border-t border-white/20 pt-4 pr-6">
          <p className="text-cable/70 text-sm">{s.person}, {s.region}</p>
          <p className="text-white text-lg font-semibold leading-snug mt-1">{s.from}<span className="text-cable/60 font-normal"> to </span>{s.to}</p>
          <p className="serif text-cable/80 mt-2 text-[0.98rem] leading-snug">{s.lesson}</p>
        </figure>
      ))}
    </Marquee>
  );
  return (
    <section className="bg-night text-white py-24 overflow-hidden" aria-labelledby="stories-title">
      <div className="max-w-[1240px] mx-auto px-5 mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 id="stories-title" className="text-[clamp(2.2rem,5vw,4rem)] font-extrabold tracking-[-0.04em] max-w-[14ch]">People have crossed before.</h2>
          <p className="serif text-xl text-cable/80 mt-4 max-w-xl">19 real switches. Almost all were carried by proof of work or a bridge role, not a certificate.</p>
        </div>
        <Link href="/stories" className="btn border border-white/30 text-white hover:border-white">Sources</Link>
      </div>
      <div className="space-y-10">{row(STORIES.slice(0, half))}{row(STORIES.slice(half), true)}</div>
    </section>
  );
}
