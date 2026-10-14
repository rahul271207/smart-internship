import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
import { evaluateEligibility } from "@/lib/services/eligibility.js";
import { calculateMatch } from "@/lib/services/matching.js";
import { getMatchingConfig } from "@/lib/services/systemConfig.js";

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  const payload = await request.json();
  const db = await getDb();
  const intern = await db.internships.findOne({ _id: payload.internship_id });
  if (!intern) {
    return NextResponse.json({ detail: "Internship not found." }, { status: 404 });
  }

  let student;
  if (user.role === "student") {
    student = await db.students.findOne({ user_id: user._id });
  } else {
    if (!payload.student_id) {
      return NextResponse.json({ detail: "student_id is required." }, { status: 400 });
    }
    student = await db.students.findOne({ _id: payload.student_id });
  }
  if (!student) {
    return NextResponse.json({ detail: "Student not found." }, { status: 404 });
  }

  const owner = await db.users.findOne({ _id: student.user_id });
  const studentView = { ...student, name: owner ? owner.name : null };
  const { weights } = await getMatchingConfig();
  const match = calculateMatch(studentView, intern, weights);
  const eligibility = evaluateEligibility(studentView, intern);

  return NextResponse.json({ eligibility, match });
}
