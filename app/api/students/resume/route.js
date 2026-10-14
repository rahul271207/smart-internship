import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
import { writeAudit } from "@/lib/audit.js";
import { extractResume } from "@/lib/services/resumeParser.js";
import { config } from "@/lib/config.js";

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "student") {
    return NextResponse.json({ detail: "Student authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const student = await db.students.findOne({ user_id: user._id });
  if (!student) {
    return NextResponse.json({ detail: "Student profile not found." }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ detail: "No file uploaded." }, { status: 400 });
    }

    const filename = file.name || "resume.pdf";
    if (!filename.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ detail: "Only PDF resumes are accepted." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const maxBytes = config.maxResumeMb * 1024 * 1024;
    if (buffer.length > maxBytes) {
      return NextResponse.json({ detail: `File exceeds ${config.maxResumeMb} MB.` }, { status: 400 });
    }

    const extracted = await extractResume(buffer, filename);
    const now = new Date().toISOString();

    await db.students.updateOne(
      { _id: student._id },
      {
        $set: {
          resume_metadata: {
            filename,
            size: buffer.length,
            stored: true,
            last_extraction_status: extracted.status,
          },
          resume_extraction: extracted,
          updated_at: now,
        },
      }
    );

    await writeAudit(user._id, "student", "upload_resume", "student", student._id);
    return NextResponse.json(extracted);
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
