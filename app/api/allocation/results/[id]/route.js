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

  const published = await db.allocation_rounds.findOne({ status: "published" }, { sort: { published_at: -1 } });
  if (!published) {
    return NextResponse.json({ items: [] });
  }

  const rows = await db.allocations.find({ allocation_round_id: published._id, student_id: id }).toArray();
  return NextResponse.json({
    items: rows.map((r) => ({ ...r, id: String(r._id) })),
    round_id: String(published._id),
  });
}
