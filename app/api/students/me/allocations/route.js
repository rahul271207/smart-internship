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

  const published = await db.allocation_rounds.find({ status: "published" }).sort({ published_at: -1 }).toArray();
  if (published.length === 0) {
    return NextResponse.json({ published: false, items: [], results: [], notice: "No allocation round has been published yet." });
  }

  const latest = published[0];
  const rows = await db.allocations.find({ allocation_round_id: latest._id, student_id: String(student._id) }).toArray();
  const rawInternships = await db.internships.find({}).toArray();
  const internMap = {};
  for (const i of rawInternships) {
    internMap[String(i._id)] = i;
  }

  const items = rows.map((row) => {
    const intern = internMap[String(row.internship_id)] || {};
    return {
      ...row,
      id: String(row._id),
      internship_title: intern.title,
      round_name: latest.round_name,
    };
  });

  return NextResponse.json({
    published: true,
    round: { id: String(latest._id), name: latest.round_name, status: latest.status },
    items,
    results: items,
  });
}
