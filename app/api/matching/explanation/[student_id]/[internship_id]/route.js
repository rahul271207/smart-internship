import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
import { calculateMatch } from "@/lib/services/matching.js";
import { getMatchingConfig } from "@/lib/services/systemConfig.js";

export async function GET(request, { params }) {
  const { student_id, internship_id } = await params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  const db = await getDb();
  if (user.role === "student") {
    const s = await db.students.findOne({ user_id: user._id });
    if (!s || String(s._id) !== student_id) {
      return NextResponse.json({ detail: "Not your records." }, { status: 403 });
    }
  }

  const intern = await db.internships.findOne({ _id: internship_id });
  const student = await db.students.findOne({ _id: student_id });
  if (!intern || !student) {
    return NextResponse.json({ detail: "Not found." }, { status: 404 });
  }

  const owner = await db.users.findOne({ _id: student.user_id });
  const { weights } = await getMatchingConfig();
  const match = calculateMatch({ ...student, name: owner ? owner.name : null }, intern, weights);

  return NextResponse.json(match);
}
