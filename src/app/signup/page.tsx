import { AuthForm } from "@/components/AuthForm";
import { getUser } from "@/lib/auth";
export default async function Page() {
  const u = await getUser().catch(() => null);
  return <AuthForm mode="signup" isGuest={!!u?.isGuest} />;
}
