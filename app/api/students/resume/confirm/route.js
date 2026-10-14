import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
import { writeAudit } from "@/lib/audit.js";

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
  const confirmed = payload || {};
  const newSkills = Array.from(new Set([...(student.skills || []), ...(payload.skills || [])]));

  await db.students.updateOne(
    { _id: student._id },
    {
      $set: {
        resume_confirmed: confirmed,
        skills: newSkills,
        updated_at: new Date().toISOString(),
      },
    }
  );

  await writeAudit(user._id, "student", "confirm_resume", "student", student._id);
  return NextResponse.json({
    message: "Confirmed resume fields saved. They can now be used in matching.",
    confirmed,
  });
}
