import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

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

  const apps = await db.applications.find({ student_id: String(student._id) }).toArray();
  const rawInternships = await db.internships.find({}).toArray();
  const internMap = {};
  for (const i of rawInternships) {
    internMap[String(i._id)] = i;
  }

  const items = apps.map((app) => {
    const intern = internMap[String(app.internship_id)] || {};
    return {
      ...app,
      id: String(app._id),
      internship: {
        id: String(intern._id || ""),
        title: intern.title,
        organization_name: intern.organization_name,
        domain: intern.domain,
        seats: intern.seats,
        location: intern.location,
        work_mode: intern.work_mode,
        stipend: intern.stipend,
      },
    };
  });

  return NextResponse.json(items);
}
