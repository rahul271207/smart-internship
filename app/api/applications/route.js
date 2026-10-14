import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
import { writeAudit } from "@/lib/audit.js";
import { evaluateEligibility } from "@/lib/services/eligibility.js";
import { calculateMatch } from "@/lib/services/matching.js";
import { getMatchingConfig } from "@/lib/services/systemConfig.js";

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "student") {
    return NextResponse.json({ detail: "Student authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const student = await db.students.findOne({ user_id: user._id });
  if (!student) {
    return NextResponse.json({ detail: "Student profile not found." }, { status: 404 });
  }

  const payload = await request.json();
  const internId = payload.internship_id;
  const intern = await db.internships.findOne({ _id: internId });
  if (!intern) {
    return NextResponse.json({ detail: "Internship not found." }, { status: 404 });
  }

  const existing = await db.applications.findOne({
    student_id: String(student._id),
    internship_id: String(intern._id),
  });
  if (existing) {
    return NextResponse.json({ detail: "You have already applied to this internship." }, { status: 409 });
  }

  const studentView = { ...student, name: user.name, email: user.email };
  const eligibility = evaluateEligibility(studentView, intern);
  if (!eligibility.eligible) {
    return NextResponse.json(
      { message: "You are not eligible for this internship.", eligibility },
      { status: 400 }
    );
  }

  const { weights } = await getMatchingConfig();
  const match = calculateMatch(studentView, intern, weights);
  const now = new Date().toISOString();
  const appId = "app_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  const doc = {
    _id: appId,
    student_id: String(student._id),
    internship_id: String(intern._id),
    status: "submitted",
    eligibility_result: eligibility,
    match_score: match.overall,
    match_breakdown: match,
    preference_rank: match.preference_rank,
    applied_at: now,
    updated_at: now,
  };

  await db.applications.insertOne(doc);
  await writeAudit(user._id, "student", "apply", "application", appId);

  return NextResponse.json({ ...doc, id: appId }, { status: 201 });
}
