"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type Step = { href: string; label: string; done: boolean; locked: boolean };

export function RailNav({ steps }: { steps: Step[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Your transition">
      {/* Desktop: vertical line with stations */}
      <ol className="hidden md:block relative">
        <span className="absolute left-[11px] top-3 bottom-3 w-[3px] bg-rule rounded" aria-hidden />
        {steps.map((s, i) => {
          const active = path.startsWith(s.href);
          return (
            <li key={s.href} className="relative">
              {s.locked ? (
                <span className="flex items-center gap-3 py-2.5 text-mist cursor-not-allowed" title="Finish the earlier step first">
                  <Dot n={i + 1} state="locked" />{s.label}
                </span>
              ) : (
                <Link href={s.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 py-2.5 rounded-md ${active ? "font-semibold text-ink" : "text-graphite hover:text-ink"}`}>
                  <Dot n={i + 1} state={active ? "active" : s.done ? "done" : "open"} />{s.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      {/* Mobile: horizontal */}
      <ol className="md:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {steps.map((s, i) => {
          const active = path.startsWith(s.href);
          return (
            <li key={s.href} className="flex-none">
              {s.locked ? <span className="chip text-mist">{i + 1}. {s.label}</span> : <Link href={s.href} className={`chip ${active ? "bg-ink text-white border-ink" : s.done ? "" : "text-graphite"}`}>{i + 1}. {s.label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Dot({ n, state }: { n: number; state: "active" | "done" | "open" | "locked" }) {
  const base = "relative z-10 w-[25px] h-[25px] rounded-full grid place-items-center text-[11px] font-semibold flex-none";
  if (state === "active") return <span className={`${base} bg-ink text-white`}>{n}</span>;
  if (state === "done") return <span className={`${base} bg-ink text-white`} aria-label="done"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>;
  if (state === "locked") return <span className={`${base} bg-paper border-2 border-dashed border-rule text-mist`}>{n}</span>;
  return <span className={`${base} bg-sheet border-2 border-ink text-ink`}>{n}</span>;
}
