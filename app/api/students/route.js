import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ detail: "Administrator authorization required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const q = (searchParams.get("q") || "").toLowerCase();

  const db = await getDb();
  const rawUsers = await db.users.find({ role: "student" }).toArray();
  const userMap = {};
  for (const u of rawUsers) {
    userMap[String(u._id)] = u;
  }

  const students = await db.students.find({}).skip(skip).limit(limit).toArray();
  const items = [];
  for (const s of students) {
    const owner = userMap[String(s.user_id)] || {};
    if (q) {
      const blob = `${owner.name || ""} ${owner.email || ""} ${s.branch || ""}`.toLowerCase();
      if (!blob.includes(q)) continue;
    }
    items.push({
      ...s,
      id: String(s._id),
      name: owner.name,
      email: owner.email,
      is_active: owner.is_active,
    });
  }

  const total = await db.students.countDocuments();
  return NextResponse.json({ items, total });
}
