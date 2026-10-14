import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || !["organization", "admin"].includes(user.role)) {
    return NextResponse.json({ detail: "Organization authorization required." }, { status: 403 });
  }

  if (user.role === "admin") {
    return NextResponse.json({ role: "admin" });
  }

  const db = await getDb();
  const org = await db.organizations.findOne({ user_id: user._id });
  if (!org) {
    return NextResponse.json({ detail: "Organization profile not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...org,
    id: String(org._id),
    name: user.name,
    email: user.email,
  });
}

export async function PUT(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "organization") {
    return NextResponse.json({ detail: "Organization authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const org = await db.organizations.findOne({ user_id: user._id });
  if (!org) {
    return NextResponse.json({ detail: "Organization profile not found." }, { status: 404 });
  }

  const payload = await request.json();
  const updates = { ...payload, updated_at: new Date().toISOString() };
  await db.organizations.updateOne({ _id: org._id }, { $set: updates });

  const updated = await db.organizations.findOne({ _id: org._id });
  return NextResponse.json({ ...updated, id: String(updated._id) });
}
