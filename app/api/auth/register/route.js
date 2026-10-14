import { NextResponse } from "next/server";
import { cleanUser, createAccessToken, hashPassword } from "@/lib/auth.js";
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

    if (!name || name.length < 2) {
      return NextResponse.json({ detail: "Name must be at least 2 characters." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ detail: "A valid email is required." }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ detail: "Password must be at least 8 characters." }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.users.findOne({ email });
    if (existing) {
      return NextResponse.json({ detail: "An account with this email already exists." }, { status: 409 });
    }

    const userId = "user_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const studentId = "stu_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const userDoc = {
      _id: userId,
      name,
      email,
      password_hash: hashPassword(password),
      role: "student",
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    await db.users.insertOne(userDoc);

    const studentDoc = {
      _id: studentId,
      user_id: userId,
      skills: [],
      interests: [],
      projects: [],
      certifications: [],
      preferred_domains: [],
      preferred_internships: [],
      preferred_locations: [],
      profile_completion: 10,
      created_at: now,
      updated_at: now,
    };
    await db.students.insertOne(studentDoc);

    await writeAudit(userId, "student", "register", "user", userId);
    const token = createAccessToken(userId, "student");

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user: cleanUser(userDoc),
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
