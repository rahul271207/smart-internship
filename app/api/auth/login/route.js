import { NextResponse } from "next/server";
import { cleanUser, createAccessToken, verifyPassword } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
import { writeAudit } from "@/lib/audit.js";
import { ensureSeeded } from "@/lib/seed.js";

export async function POST(request) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    const db = await getDb();
    const user = await db.users.findOne({ email });

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ detail: "Incorrect email or password." }, { status: 401 });
    }
    if (!user.is_active) {
      return NextResponse.json({ detail: "Account is inactive or awaiting approval." }, { status: 403 });
    }

    const token = createAccessToken(user._id, user.role);
    await writeAudit(user._id, user.role, "login", "user", user._id);

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      user: cleanUser(user),
    });
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
