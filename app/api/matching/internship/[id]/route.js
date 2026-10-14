import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

export async function GET(request, { params }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !["admin", "organization"].includes(user.role)) {
    return NextResponse.json({ detail: "Authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const apps = await db.applications.find({ internship_id: id }).toArray();
  const items = apps.map((a) => ({
    student_id: a.student_id,
    match_score: a.match_score,
    eligible: Boolean(a.eligibility_result && a.eligibility_result.eligible),
  }));

  return NextResponse.json({ items });
}
