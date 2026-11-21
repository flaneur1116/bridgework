"use client";
import type { Constraints } from "@/lib/data/personas";
import { fmtInr } from "@/lib/engine";

export function ConstraintFields({ value, onChange, compact = false }: { value: Constraints; onChange: (c: Constraints) => void; compact?: boolean }) {
  const set = <K extends keyof Constraints>(k: K, v: Constraints[K]) => onChange({ ...value, [k]: v });
  const num = (k: keyof Constraints) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, (Number(e.target.value) || 0) as never);
  return (
    <div className={`grid gap-5 ${compact ? "" : "sm:grid-cols-2"}`}>
      <div className={compact ? "" : "sm:col-span-2"}>
        <div className="flex justify-between items-baseline"><label className="label" htmlFor="hpw">Hours per week you can give</label><span className="display text-xl font-semibold">{value.hoursPerWeek}</span></div>
        <input id="hpw" type="range" min={2} max={40} value={value.hoursPerWeek} onChange={num("hoursPerWeek")} />
      </div>
      <div>
        <label className="label" htmlFor="budget">Budget for learning (Rs)</label>
        <input id="budget" className="input" type="number" inputMode="numeric" min={0} step={5000} value={value.budgetInr} onChange={num("budgetInr")} />
        <p className="hint mt-1">Rs {fmtInr(value.budgetInr)}</p>
      </div>
      <div>
        <label className="label" htmlFor="ctc">Current CTC (lakh per year)</label>
        <input id="ctc" className="input" type="number" inputMode="decimal" min={0} step={0.5} value={value.currentCtcLpa} onChange={num("currentCtcLpa")} />
      </div>
      <div>
        <label className="label" htmlFor="floor">Minimum monthly income you need (Rs)</label>
        <input id="floor" className="input" type="number" inputMode="numeric" min={0} step={5000} value={value.incomeFloorMonthly} onChange={num("incomeFloorMonthly")} />
      </div>
      <div>
        <label className="label" htmlFor="cut">Largest pay cut you would accept (%)</label>
        <input id="cut" className="input" type="number" inputMode="numeric" min={0} max={100} value={value.maxPayCutPct} onChange={num("maxPayCutPct")} />
      </div>
      <label className={`flex items-start gap-3 ${compact ? "" : "sm:col-span-2"}`}>
        <input type="checkbox" className="mt-1 w-4 h-4 accent-[#13262f]" checked={value.fullTimeStudyOk} onChange={(e) => set("fullTimeStudyOk", e.target.checked)} />
        <span><span className="font-medium">I could stop working for a year to study full time</span><span className="hint block">Leave this off if you need to keep your income.</span></span>
      </label>
      <label className={`flex items-start gap-3 ${compact ? "" : "sm:col-span-2"}`}>
        <input type="checkbox" className="mt-1 w-4 h-4 accent-[#13262f]" checked={value.canRelocate} onChange={(e) => set("canRelocate", e.target.checked)} />
        <span className="font-medium">I can relocate to another city</span>
      </label>
    </div>
  );
}
