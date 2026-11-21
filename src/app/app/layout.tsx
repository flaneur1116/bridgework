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
    { href: "/app/start", label: "Profile", done: hasProfile, locked: false },
    { href: "/app/evidence", label: "Evidence", done: hasProfile, locked: !hasProfile },
    { href: "/app/routes", label: "Routes", done: !!profile?.selectedRoute, locked: !hasProfile },
    { href: "/app/plan", label: "Plan", done: !!plan, locked: !plan },
    { href: "/app/proof", label: "Proof", done: !!grade, locked: !hasProfile },
    { href: "/app/checkin", label: "Check-in", done: !!diag, locked: !plan },
  ];
  return (
    <div className="min-h-dvh">
      {MOCK && <div className="bg-bridge text-night text-center text-sm py-1.5 font-medium">Local test mode: AI responses are fixtures.</div>}
      <header className="border-b border-rule bg-paper/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1320px] mx-auto px-5 h-16 flex items-center gap-6">
          <Link href="/" className="flex-none"><Logo /></Link>
          <div className="flex-1 min-w-0 hidden md:flex justify-center"><RailNav steps={steps} /></div>
          <div className="flex-1 md:hidden" />
          <div className="flex-none flex items-center gap-1 text-sm">
            {user.isGuest && <Link href="/signup" className="btn btn-ghost hidden sm:inline-flex">Save</Link>}
            <Link href="/app/account" className="btn btn-quiet">{user.isGuest ? "Guest" : user.name || "Account"}</Link>
          </div>
        </div>
        <div className="md:hidden px-5 pb-2"><RailNav steps={steps} /></div>
      </header>
      <main className="max-w-[1320px] mx-auto px-5 py-8 md:py-12 pb-28">{children}</main>
      {hasProfile && <AskPanel />}
    </div>
  );
}
