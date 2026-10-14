import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

export async function GET(request, { params }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !["admin", "student"].includes(user.role)) {
    return NextResponse.json({ detail: "Authorization required." }, { status: 403 });
  }

  const db = await getDb();
  if (user.role === "student") {
    const student = await db.students.findOne({ user_id: user._id });
    if (!student || String(student._id) !== id) {
      return NextResponse.json({ detail: "Not your records." }, { status: 403 });
    }
  }

  const apps = await db.applications.find({ student_id: id }).toArray();
  return NextResponse.json({ items: apps.map((a) => ({ ...a, id: String(a._id) })) });
}
