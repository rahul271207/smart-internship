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
  const student = await db.students.findOne({ _id: id });
  if (!student) {
    return NextResponse.json({ detail: "Student not found." }, { status: 404 });
  }

  if (user.role === "student" && String(student.user_id) !== String(user._id)) {
    return NextResponse.json({ detail: "You can only view your own profile." }, { status: 403 });
  }
  if (user.role === "organization") {
    return NextResponse.json({ detail: "Organizations cannot view full student profiles." }, { status: 403 });
  }

  const owner = await db.users.findOne({ _id: student.user_id });
  return NextResponse.json({
    ...student,
    id: String(student._id),
    name: owner ? owner.name : null,
    email: owner ? owner.email : null,
  });
}
