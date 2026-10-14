import { NextResponse } from "next/server";
import { cleanUser, hashPassword } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
import { writeAudit } from "@/lib/audit.js";
import { ensureSeeded } from "@/lib/seed.js";

export async function POST(request) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const orgName = (body.organization_name || body.name || "").trim();
    const description = body.description || "";
    const location = body.location || "";

    if (!name || !email || !password || !orgName) {
      return NextResponse.json({ detail: "Name, email, password, and organization name are required." }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.users.findOne({ email });
    if (existing) {
      return NextResponse.json({ detail: "An account with this email already exists." }, { status: 409 });
    }

    const userId = "user_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const orgId = "org_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const userDoc = {
      _id: userId,
      name,
      email,
      password_hash: hashPassword(password),
      role: "organization",
      is_active: false,
      created_at: now,
      updated_at: now,
    };
    await db.users.insertOne(userDoc);

    const orgDoc = {
      _id: orgId,
      user_id: userId,
      organization_name: orgName,
      description,
      location,
      approval_status: "pending",
      created_at: now,
      updated_at: now,
    };
    await db.organizations.insertOne(orgDoc);

    await writeAudit(userId, "organization", "register_organization", "organization", orgId);

    return NextResponse.json({
      message: "Organization account created and awaiting administrator approval.",
      user: cleanUser(userDoc),
      approval_status: "pending",
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
