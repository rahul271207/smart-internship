import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

export async function GET(request, { params }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  const db = await getDb();
  const app = await db.applications.findOne({ _id: id });
  if (!app) {
    return NextResponse.json({ detail: "Application not found." }, { status: 404 });
  }

  if (user.role === "student") {
    const student = await db.students.findOne({ user_id: user._id });
    if (!student || String(app.student_id) !== String(student._id)) {
      return NextResponse.json({ detail: "Not your application." }, { status: 403 });
    }
  }

  if (user.role === "organization") {
    const org = await db.organizations.findOne({ user_id: user._id });
    const intern = await db.internships.findOne({ _id: app.internship_id });
    if (!org || !intern || String(intern.organization_id) !== String(org._id)) {
      return NextResponse.json({ detail: "Not your internship." }, { status: 403 });
    }
  }

  return NextResponse.json({ ...app, id: String(app._id) });
}
