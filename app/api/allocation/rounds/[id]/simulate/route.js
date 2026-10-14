import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
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
      simulate: true,
      seatOverrides: payload.seat_overrides,
      weightOverrides: payload.weight_overrides,
      requirementOverrides: payload.requirement_overrides,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 400 });
  }
}
