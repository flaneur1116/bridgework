import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getProfile, getClaims, getQuestions, getPlanHistory, getActivePlan, getEvents } from "@/lib/store";

export async function GET() {
  const u = await getUser();
  if (!u) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const data = {
    exportedAt: new Date().toISOString(),
    account: { email: u.email, name: u.name },
    profile: await getProfile(u.id),
    claims: await getClaims(u.id),
    questions: await getQuestions(u.id),
    activePlan: await getActivePlan(u.id),
    planHistory: await getPlanHistory(u.id),
    events: await getEvents(u.id),
  };
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json", "content-disposition": 'attachment; filename="bridgework-export.json"' } });
}
