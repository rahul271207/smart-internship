import { NextResponse } from "next/server";
import { cleanUser, getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
import { ensureSeeded } from "@/lib/seed.js";

export async function GET(request) {
  await ensureSeeded();
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const db = await getDb();
  const extra = {};
  if (user.role === "student") {
    const student = await db.students.findOne({ user_id: user._id });
    if (student) {
      extra.student = { ...student, id: String(student._id) };
    }
  }
  if (user.role === "organization") {
    const org = await db.organizations.findOne({ user_id: user._id });
    if (org) {
      extra.organization = { ...org, id: String(org._id) };
    }
  }

  const cleaned = cleanUser(user);
  return NextResponse.json({
    ...cleaned,
    ...extra,
    user: cleaned,
  });
}
