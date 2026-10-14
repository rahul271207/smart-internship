import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ detail: "Administrator authorization required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  let roundId = searchParams.get("round_id");
  const status = searchParams.get("status");

  const db = await getDb();
  if (!roundId) {
    const latest = await db.allocation_rounds.findOne({}, { sort: { created_at: -1 } });
    if (!latest) {
      return NextResponse.json({ items: [], round: null });
    }
    roundId = String(latest._id);
  }

  const query = { allocation_round_id: roundId };
  if (status) query.status = status;

  const rawInternships = await db.internships.find({}).toArray();
  const rawStudents = await db.students.find({}).toArray();
  const rawUsers = await db.users.find({}).toArray();

  const internMap = {};
  for (const i of rawInternships) internMap[String(i._id)] = i;
  const studentMap = {};
  for (const s of rawStudents) studentMap[String(s._id)] = s;
  const userMap = {};
  for (const u of rawUsers) userMap[String(u._id)] = u;

  const rows = await db.allocations.find(query).toArray();
  const items = rows.map((row) => {
    const student = studentMap[String(row.student_id)] || {};
    const owner = userMap[String(student.user_id)] || {};
    const intern = internMap[String(row.internship_id || "")] || {};
    return {
      ...row,
      id: String(row._id),
      student_name: owner.name,
      student_email: owner.email,
      internship_title: intern.title,
    };
  });

  const roundDoc = await db.allocation_rounds.findOne({ _id: roundId });
  return NextResponse.json({
    round: roundDoc ? { ...roundDoc, id: String(roundDoc._id) } : null,
    items,
  });
}
