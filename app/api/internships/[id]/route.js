import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
import { writeAudit } from "@/lib/audit.js";

export async function GET(request, { params }) {
  const { id } = await params;
  const db = await getDb();
  const doc = await db.internships.findOne({ _id: id });
  if (!doc) {
    return NextResponse.json({ detail: "Internship not found." }, { status: 404 });
  }

  const applicationCount = await db.applications.countDocuments({ internship_id: id });
  return NextResponse.json({
    ...doc,
    id: String(doc._id),
    application_count: applicationCount,
  });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !["organization", "admin"].includes(user.role)) {
    return NextResponse.json({ detail: "Organization or admin authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const doc = await db.internships.findOne({ _id: id });
  if (!doc) {
    return NextResponse.json({ detail: "Internship not found." }, { status: 404 });
  }

  if (user.role === "organization") {
    const org = await db.organizations.findOne({ user_id: user._id });
    if (!org || String(doc.organization_id) !== String(org._id)) {
      return NextResponse.json({ detail: "You can only edit your own internships." }, { status: 403 });
    }
  }

  const payload = await request.json();
  const before = { seats: doc.seats, minimum_cgpa: doc.minimum_cgpa, eligible_branches: doc.eligible_branches };
  const updates = { ...payload, updated_at: new Date().toISOString() };

  await db.internships.updateOne({ _id: id }, { $set: updates });
  await writeAudit(user._id, user.role, "update_internship", "internship", id, {
    beforeState: before,
    afterState: { seats: updates.seats, minimum_cgpa: updates.minimum_cgpa, eligible_branches: updates.eligible_branches },
  });

  const updated = await db.internships.findOne({ _id: id });
  return NextResponse.json({ ...updated, id: String(updated._id) });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || !["organization", "admin"].includes(user.role)) {
    return NextResponse.json({ detail: "Organization or admin authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const doc = await db.internships.findOne({ _id: id });
  if (!doc) {
    return NextResponse.json({ detail: "Internship not found." }, { status: 404 });
  }

  if (user.role === "organization") {
    const org = await db.organizations.findOne({ user_id: user._id });
    if (!org || String(doc.organization_id) !== String(org._id)) {
      return NextResponse.json({ detail: "You can only deactivate your own internships." }, { status: 403 });
    }
  }

  await db.internships.updateOne({ _id: id }, { $set: { status: "closed", updated_at: new Date().toISOString() } });
  await writeAudit(user._id, user.role, "deactivate_internship", "internship", id);

  return NextResponse.json({ id, status: "closed" });
}
