import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

export async function GET(request, { params }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !["organization", "admin"].includes(user.role)) {
    return NextResponse.json({ detail: "Organization or admin authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const intern = await db.internships.findOne({ _id: id });
  if (!intern) {
    return NextResponse.json({ detail: "Internship not found." }, { status: 404 });
  }

  if (user.role === "organization") {
    const org = await db.organizations.findOne({ user_id: user._id });
    if (!org || String(intern.organization_id) !== String(org._id)) {
      return NextResponse.json({ detail: "Not your internship." }, { status: 403 });
    }
  }

  const apps = await db.applications.find({ internship_id: id }).toArray();
  const rawStudents = await db.students.find({}).toArray();
  const rawUsers = await db.users.find({}).toArray();

  const studentsMap = {};
  for (const s of rawStudents) studentsMap[String(s._id)] = s;
  const usersMap = {};
  for (const u of rawUsers) usersMap[String(u._id)] = u;

  const items = apps.map((app) => {
    const student = studentsMap[String(app.student_id)] || {};
    const owner = usersMap[String(student.user_id)] || {};
    return {
      ...app,
      id: String(app._id),
      student_name: owner.name,
      student_branch: student.branch,
      student_cgpa: student.cgpa,
    };
  });

  return NextResponse.json({ items });
}
