"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Safari } from "../vendor/safari";

// Sticky scroll reveal (pattern after Aceternity UI's Sticky Scroll Reveal, rebuilt here):
// the steps scroll on the left while the product screen holds still and changes on the right.
const STEPS = [
  { key: "ledger", title: "Your experience, with receipts.", body: "Every skill quotes the resume line it came from.", url: "bridgework.app/evidence" },
  { key: "routes", title: "Every route, priced.", body: "Months, hours, rupees and lost income, side by side.", url: "bridgework.app/routes" },
  { key: "plan", title: "A plan that fits your week.", body: "Built from your own projects. Repacks when life changes.", url: "bridgework.app/plan" },
  { key: "checkin", title: "Stuck? A diagnosis.", body: "It checks how you apply before it sells you a course.", url: "bridgework.app/check-in" },
];

export function Crossing() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="bg-paper" aria-labelledby="crossing-title">
      <div className="max-w-[1240px] mx-auto px-5 pt-24 md:pt-32">
        <h2 id="crossing-title" className="text-[clamp(2.2rem,5vw,4rem)] font-extrabold tracking-[-0.04em] max-w-[16ch]">How it works.</h2>
      </div>
      <div className="max-w-[1240px] mx-auto px-5 grid lg:grid-cols-[0.8fr_1.2fr] gap-12 pb-24">
        <ol>
          {STEPS.map((s, i) => (
            <li key={s.key} data-i={i} ref={(el) => { refs.current[i] = el; }} className="min-h-[auto] lg:min-h-[70vh] flex flex-col justify-center py-12 lg:py-0">
              <span className={`text-sm font-semibold tabular-nums transition-colors ${active === i ? "text-ink" : "text-mist"}`}>0{i + 1}</span>
              <h3 className={`text-[clamp(1.7rem,3vw,2.4rem)] font-bold mt-2 transition-colors duration-500 ${active === i ? "text-ink" : "lg:text-mist"}`}>{s.title}</h3>
              <p className={`text-[1.15rem] mt-3 max-w-md transition-colors duration-500 ${active === i ? "text-graphite" : "lg:text-mist"}`}>{s.body}</p>
              <div className="lg:hidden mt-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,.8)] ring-1 ring-white/10 rounded-xl overflow-hidden"><Safari url={s.url} imageSrc={`/screens/${s.key}.webp`} /></div>
            </li>
          ))}
        </ol>
        <div className="hidden lg:block">
          <div className="sticky top-[12vh] h-[76vh] flex items-center">
            <div className="relative w-full shadow-[0_60px_120px_-40px_rgba(0,0,0,.8)] ring-1 ring-white/10 rounded-xl">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div key={STEPS[active].key} initial={reduce ? false : { opacity: 0, y: 24, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? undefined : { opacity: 0, y: -24, scale: 0.985 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
                  <Safari url={STEPS[active].url} imageSrc={`/screens/${STEPS[active].key}.webp`} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
