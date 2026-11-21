import { requireUser } from "@/lib/auth";
import { getClaims } from "@/lib/store";
import { IntakeForm } from "@/components/IntakeForm";

export default async function StartPage() {
  const user = await requireUser();
  const claims = await getClaims(user.id);
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-semibold">Start with what you have done</h1>
      <p className="text-graphite mt-3 text-lg">Bridgework turns your work history into evidence, then works out where that evidence can take you within your limits.</p>
      <div className="mt-8"><IntakeForm hasExisting={claims.length > 0} /></div>
    </div>
  );
}
