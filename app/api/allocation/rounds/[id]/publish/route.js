import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { writeAudit } from "@/lib/audit.js";
import { publishRound } from "@/lib/services/allocationService.js";

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ detail: "Administrator authorization required." }, { status: 403 });
  }

  try {
    const result = await publishRound(id, user._id);
    await writeAudit(user._id, "admin", "publish_allocation", "allocation_round", id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 400 });
  }
}
