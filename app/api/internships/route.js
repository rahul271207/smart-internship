import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
import { writeAudit } from "@/lib/audit.js";
import { branchMatches } from "@/lib/services/eligibility.js";

export async function GET(request) {
  const user = await getUserFromRequest(request);
  const { searchParams } = new URL(request.url);

  const domain = searchParams.get("domain");
  const branch = searchParams.get("branch");
  const location = searchParams.get("location");
  const workMode = searchParams.get("work_mode");
  const q = searchParams.get("q");
  const statusParam = searchParams.get("status") || "published";
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

  const db = await getDb();
  const query = {};

  if (!user || user.role !== "admin") {
    query.status = { $in: ["published", "active", "open"] };
  } else if (statusParam) {
    query.status = statusParam;
  }
  if (domain) query.domain = domain;
  if (workMode) query.work_mode = workMode;
  if (location) query.location = { $regex: location, $options: "i" };

  const docs = await db.internships.find(query).skip(skip).limit(limit).toArray();
  const items = [];

  for (const doc of docs) {
    if (branch && !branchMatches(branch, doc.eligible_branches || [])) {
      continue;
    }
    if (q) {
      const blob = `${doc.title || ""} ${doc.description || ""} ${doc.organization_name || ""}`.toLowerCase();
      if (!blob.includes(q.toLowerCase())) continue;
    }
    items.push({
      ...doc,
      id: String(doc._id),
    });
  }

  return NextResponse.json({ items, total: items.length });
}

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user || !["organization", "admin"].includes(user.role)) {
    return NextResponse.json({ detail: "Organization or admin authorization required." }, { status: 403 });
  }

  const db = await getDb();
  let org = null;
  if (user.role === "organization") {
    org = await db.organizations.findOne({ user_id: user._id });
    if (!org) {
      return NextResponse.json({ detail: "Organization profile not found." }, { status: 404 });
    }
    if (org.approval_status !== "approved") {
      return NextResponse.json({ detail: "Organization account is not approved yet." }, { status: 403 });
    }
  } else {
    org = (await db.organizations.findOne({ approval_status: "approved" })) || {
      _id: "admin-internal",
      organization_name: "Platform",
    };
  }

  const payload = await request.json();
  const now = new Date().toISOString();
  const internId = "int_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  const doc = {
    ...payload,
    _id: internId,
    organization_id: String(org._id),
    organization_name: org.organization_name || org.name,
    seats: parseInt(payload.seats || 1, 10),
    minimum_cgpa: parseFloat(payload.minimum_cgpa || 0),
    minimum_academic_year: parseInt(payload.minimum_academic_year || 1, 10),
    status: payload.status || "published",
    created_at: now,
    updated_at: now,
  };

  await db.internships.insertOne(doc);
  await writeAudit(user._id, user.role, "create_internship", "internship", internId, {
    afterState: { title: doc.title, seats: doc.seats },
  });

  return NextResponse.json({ ...doc, id: internId }, { status: 201 });
}
