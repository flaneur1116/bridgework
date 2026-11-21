"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import Threads from "../vendor/Threads";
import Noise from "../vendor/Noise";
import BlurText from "../vendor/BlurText";
import { StartButtons } from "../StartButtons";

// Night over the sea link: cables (Threads) drift slower than the text as you scroll.
export function Hero({ signedIn }: { signedIn: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const cablesY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-22%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0]);

  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden bg-night text-white flex flex-col">
      <motion.div aria-hidden className="absolute inset-x-0 bottom-[-6%] h-[78%]" style={{ y: cablesY }}>
        <Threads className="w-full h-full" color={[0.84, 0.9, 0.89]} accentColor={[0.18, 0.38, 0.91]} amplitude={0.9} distance={0.25} lineCount={70} thickness={0.5} speed={0.25} angle={8} brightness={0.9} opacity={0.6} fade={0.45} />
      </motion.div>
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,29,36,.95)_0%,rgba(11,29,36,.55)_45%,rgba(11,29,36,0)_70%,rgba(11,29,36,.9)_100%)]" />
      <Noise opacity={0.07} fps={12} className="pointer-events-none" />

      <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 flex-1 flex flex-col justify-center max-w-6xl w-full mx-auto px-5 pt-28 pb-24">
        <p className="text-cable/80 text-[0.95rem] mb-6">For working professionals in India changing function or industry</p>
        <h1 className="text-[clamp(2.9rem,8.2vw,7.2rem)] font-extrabold leading-[0.95] tracking-[-0.045em] max-w-[11ch]">
          <BlurText text="Every career switch is a crossing." animateBy="words" delay={90} stepDuration={0.45} blur={12} distance={26} className="!m-0" />
        </h1>
        <p className="serif text-[clamp(1.15rem,1.9vw,1.45rem)] text-cable/90 max-w-[36rem] mt-8 leading-snug">
          Bridgework reads your experience the way a hiring manager would, prices realistic routes in hours, rupees and months, and replans when life pushes back.
        </p>
        <div className="mt-10"><StartButtons signedIn={signedIn} dark /></div>
      </motion.div>

      <div className="relative z-10 max-w-6xl w-full mx-auto px-5 pb-8 flex justify-between items-end text-sm text-cable/70">
        <span>Scroll to see how it works</span>
        <span className="hidden sm:block">Sample profiles are fictional. The analysis is live.</span>
      </div>
    </section>
  );
}
