import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
import { writeAudit } from "@/lib/audit.js";

function calcProfileCompletion(student) {
  const checks = [
    student.degree,
    student.branch,
    student.institution,
    student.academic_year,
    student.cgpa !== undefined && student.cgpa !== null && student.cgpa !== "",
    student.skills && student.skills.length > 0,
    student.projects && student.projects.length > 0,
    (student.preferred_domains && student.preferred_domains.length > 0) ||
      (student.preferred_internships && student.preferred_internships.length > 0),
    (student.preferred_locations && student.preferred_locations.length > 0) || student.work_mode_preference,
    student.city || student.state,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((100 * filled) / checks.length);
}

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "student") {
    return NextResponse.json({ detail: "Student authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const student = await db.students.findOne({ user_id: user._id });
  if (!student) {
    return NextResponse.json({ detail: "Student profile not found." }, { status: 404 });
  }

  const completion = calcProfileCompletion(student);
  return NextResponse.json({
    ...student,
    id: String(student._id),
    name: user.name,
    email: user.email,
    profile_completion: completion,
  });
}

export async function PUT(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "student") {
    return NextResponse.json({ detail: "Student authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const student = await db.students.findOne({ user_id: user._id });
  if (!student) {
    return NextResponse.json({ detail: "Student profile not found." }, { status: 404 });
  }

  const updates = await request.json();
  const allowed = [
    "phone", "city", "state", "degree", "branch", "institution", "academic_year",
    "cgpa", "graduation_year", "skills", "interests", "projects", "certifications",
    "preferred_domains", "preferred_internships", "preferred_locations",
    "work_mode_preference", "duration_preference", "availability", "experience"
  ];

  const filteredUpdates = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  const merged = { ...student, ...filteredUpdates };
  filteredUpdates.profile_completion = calcProfileCompletion(merged);
  filteredUpdates.updated_at = new Date().toISOString();

  await db.students.updateOne({ _id: student._id }, { $set: filteredUpdates });
  await writeAudit(user._id, "student", "update_profile", "student", student._id);

  const updated = await db.students.findOne({ _id: student._id });
  return NextResponse.json({
    ...updated,
    id: String(updated._id),
    name: user.name,
    email: user.email,
  });
}
