import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getProfile, getClaims, getActivePlan, getArtifact } from "@/lib/store";
import { Logo } from "@/components/Logo";
import { RailNav } from "@/components/RailNav";
import { AskPanel } from "@/components/AskPanel";
import { MOCK } from "@/lib/ai";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [profile, claims, plan, grade, diag] = await Promise.all([
    getProfile(user.id), getClaims(user.id), getActivePlan(user.id), getArtifact(user.id, "proof_grade"), getArtifact(user.id, "diagnosis"),
  ]);
  const hasProfile = !!profile && claims.length > 0;
  const steps = [
    { href: "/app/start", label: "Your profile", done: hasProfile, locked: false },
    { href: "/app/evidence", label: "Evidence ledger", done: hasProfile, locked: !hasProfile },
    { href: "/app/routes", label: "Routes", done: !!profile?.selectedRoute, locked: !hasProfile },
    { href: "/app/plan", label: "Plan", done: !!plan, locked: !plan },
    { href: "/app/proof", label: "Proof", done: !!grade, locked: !hasProfile },
    { href: "/app/checkin", label: "Check-in", done: !!diag, locked: !plan },
  ];
  return (
    <div className="min-h-dvh">
      {MOCK && <div className="bg-bridge text-ink text-center text-sm py-1.5 font-medium">Local test mode: AI responses are fixtures, not real model output.</div>}
      <header className="border-b border-rule bg-sheet/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/app"><Logo /></Link>
          <div className="flex items-center gap-1 text-sm">
            {user.isGuest && <Link href="/signup" className="btn btn-ghost">Save to account</Link>}
            <Link href="/app/account" className="btn btn-quiet">{user.isGuest ? "Guest" : user.name || user.email}</Link>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-5 py-6 md:py-10 md:grid md:grid-cols-[200px_1fr] md:gap-10">
        <aside className="mb-6 md:mb-0 md:sticky md:top-24 md:self-start"><RailNav steps={steps} /></aside>
        <main className="min-w-0 pb-24">{children}</main>
      </div>
      {hasProfile && <AskPanel />}
    </div>
  );
}
