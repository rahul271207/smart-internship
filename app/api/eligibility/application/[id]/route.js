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

  return NextResponse.json(app.eligibility_result || {});
}
