"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type Step = { href: string; label: string; done: boolean; locked: boolean };

// The journey as a transit line: stations light up as you complete them.
export function RailNav({ steps }: { steps: Step[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Your transition" className="overflow-x-auto -mx-1 px-1">
      <ol className="flex items-center min-w-max">
        {steps.map((s, i) => {
          const active = path.startsWith(s.href);
          const dot = active ? "bg-ink ring-4 ring-ink/15" : s.done ? "bg-ink/70" : s.locked ? "border border-dashed border-mist" : "border border-graphite";
          const label = active ? "text-ink" : s.locked ? "text-mist" : "text-graphite hover:text-ink";
          const inner = (
            <span className={`flex items-center gap-2 text-[0.88rem] py-2 ${label}`}>
              <span className={`w-2.5 h-2.5 rounded-full flex-none ${dot}`} aria-hidden />
              {s.label}
            </span>
          );
          return (
            <li key={s.href} className="flex items-center">
              {i > 0 && <span className={`w-6 md:w-10 h-px mx-2 ${s.done || active ? "bg-ink/40" : "bg-rule"}`} aria-hidden />}
              {s.locked ? <span title="Finish the earlier step first">{inner}</span> : <Link href={s.href} aria-current={active ? "page" : undefined}>{inner}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
