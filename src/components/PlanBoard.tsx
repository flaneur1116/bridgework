"use client";
import { useState } from "react";
import type { Milestone } from "@/lib/store";
import type { Constraints } from "@/lib/data/personas";
import { postJson, useAction, Spinner, ErrorNote } from "./ui";

export const KIND: Record<string, { label: string; color: string }> = {
  learn: { label: "Learn", color: "var(--color-direct)" },
  build: { label: "Build", color: "var(--color-upskill)" },
  apply: { label: "Apply", color: "var(--color-mba)" },
  network: { label: "Network", color: "var(--color-bridge)" },
};

// One station on the plan's line. Details open on click so the plan reads as a list of moves.
export function MilestoneRow({ m }: { m: Milestone }) {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [note, setNote] = useState(m.note ?? "");
  const act = useAction((status: "todo" | "done" | "stuck", n?: string) => postJson(`/api/milestones/${m.id}`, { status, note: n ?? null }));
  const k = KIND[m.kind] ?? KIND.learn;
  const done = m.status === "done";
  return (
    <li className="relative pl-10 py-3">
      <span className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-rule" aria-hidden />
      <span className="absolute left-[4px] top-[18px] w-4 h-4 rounded-full border-[3px]" style={{ borderColor: k.color, background: done ? k.color : "var(--color-paper)" }} aria-hidden />
      <div className="flex items-start gap-4">
        <button className="flex-1 text-left min-w-0" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className={`font-semibold text-[1.02rem] ${done ? "line-through text-mist" : ""}`}>{m.title}</span>
          <span className="block text-sm text-mist mt-0.5">{k.label}, {m.hours} hrs{m.status === "stuck" ? <span className="text-alert">, stuck</span> : null}</span>
        </button>
        <div className="flex items-center gap-1 flex-none">
          {act.pending && <Spinner size={14} />}
          {m.status === "done" ? (
            <button className="text-sm text-graphite hover:text-ink px-2 py-1" onClick={() => act.run("todo")}>Undo</button>
          ) : (
            <>
              <button className="text-sm rounded-full border border-rule px-3 py-1 hover:border-ink" onClick={() => act.run("done")} disabled={act.pending}>Done</button>
              {m.status !== "stuck" && <button className="text-sm text-graphite hover:text-ink px-2 py-1" onClick={() => { setStuck(true); setOpen(true); }}>Stuck</button>}
              {m.status === "stuck" && <button className="text-sm text-graphite hover:text-ink px-2 py-1" onClick={() => act.run("todo")}>Unstick</button>}
            </>
          )}
        </div>
      </div>
      {open && (
        <div className="mt-3 text-[0.95rem] text-graphite space-y-1 max-w-2xl">
          <p>{m.detail}</p>
          <p><span className="text-mist">Produces </span>{m.output}</p>
          {m.status === "stuck" && m.note && <p className="text-alert">{m.note}</p>}
          {stuck && m.status === "todo" && (
            <form className="flex gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); act.run("stuck", note); setStuck(false); }}>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's blocking you?" maxLength={500} aria-label="What is blocking you" autoFocus />
              <button className="btn btn-primary">Save</button>
            </form>
          )}
        </div>
      )}
      <ErrorNote error={act.error} />
    </li>
  );
}

export function HoursQuickChange({ constraints }: { constraints: Constraints }) {
  const [h, setH] = useState(constraints.hoursPerWeek);
  const act = useAction(() => postJson("/api/constraints", { constraints: { ...constraints, hoursPerWeek: h } }));
  return (
    <div>
      <div className="flex items-baseline justify-between"><label htmlFor="qh" className="text-sm text-graphite">Hours a week</label><span className="text-2xl font-bold tabular-nums">{h}</span></div>
      <input id="qh" type="range" min={2} max={40} value={h} onChange={(e) => setH(Number(e.target.value))} className="mt-2" />
      {h !== constraints.hoursPerWeek && <button className="btn btn-primary mt-3 w-full" disabled={act.pending} onClick={() => act.run()}>{act.pending && <Spinner />}Repack plan</button>}
      <ErrorNote error={act.error} />
    </div>
  );
}
