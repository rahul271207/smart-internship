import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ detail: "Administrator authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const items = await db.allocation_rounds.find({}).sort({ created_at: -1 }).toArray();
  return NextResponse.json({ items: items.map((i) => ({ ...i, id: String(i._id) })) });
}
