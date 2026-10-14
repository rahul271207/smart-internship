import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "organization") {
    return NextResponse.json({ detail: "Organization authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const org = await db.organizations.findOne({ user_id: user._id });
  if (!org) {
    return NextResponse.json({ detail: "Organization profile not found." }, { status: 404 });
  }

  const items = await db.internships.find({ organization_id: String(org._id) }).toArray();
  return NextResponse.json(items.map((i) => ({ ...i, id: String(i._id) })));
}
