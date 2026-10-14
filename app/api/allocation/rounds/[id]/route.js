import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

export async function GET(request, { params }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ detail: "Administrator authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const doc = await db.allocation_rounds.findOne({ _id: id });
  if (!doc) {
    return NextResponse.json({ detail: "Round not found." }, { status: 404 });
  }

  const rows = await db.allocations.find({ allocation_round_id: id }).toArray();
  return NextResponse.json({
    ...doc,
    id: String(doc._id),
    results: rows.map((r) => ({ ...r, id: String(r._id) })),
  });
}
