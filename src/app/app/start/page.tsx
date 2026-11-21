import { requireUser } from "@/lib/auth";
import { getClaims } from "@/lib/store";
import { IntakeForm } from "@/components/IntakeForm";

export default async function StartPage() {
  const user = await requireUser();
  const claims = await getClaims(user.id);
  return (
    <div className="max-w-3xl">
      <h1 className="text-[clamp(2.4rem,5.5vw,4.4rem)] font-extrabold tracking-[-0.045em] leading-[0.95]">Start with what you&apos;ve done.</h1>
      <div className="mt-10"><IntakeForm hasExisting={claims.length > 0} /></div>
    </div>
  );
}
