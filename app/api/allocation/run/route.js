import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { writeAudit } from "@/lib/audit.js";
import { executeAllocationRound } from "@/lib/services/allocationService.js";

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ detail: "Administrator authorization required." }, { status: 403 });
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const result = await executeAllocationRound({
      initiatedBy: user._id,
      roundName: payload.round_name,
      simulate: false,
    });

    await writeAudit(user._id, "admin", "run_allocation", "allocation_round", result.round_id, {
      afterState: result.summary,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 400 });
  }
}
