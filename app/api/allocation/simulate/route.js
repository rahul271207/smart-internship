import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";
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
      simulate: true,
      seatOverrides: payload.seat_overrides,
      weightOverrides: payload.weight_overrides,
      requirementOverrides: payload.requirement_overrides,
    });

    const db = await getDb();
    const published = await db.allocation_rounds.find({ status: "published" }).sort({ published_at: -1 }).limit(1).toArray();
    let comparison = null;
    if (published.length > 0) {
      const pubRows = await db.allocations.find({ allocation_round_id: published[0]._id }).toArray();
      const pubMap = {};
      for (const r of pubRows) pubMap[r.student_id] = r.status;
      const simMap = {};
      for (const r of result.results) simMap[r.student_id] = r.status;

      const diffs = [];
      const allStudents = new Set([...Object.keys(pubMap), ...Object.keys(simMap)]);
      for (const sId of Array.from(allStudents).sort()) {
        if (pubMap[sId] !== simMap[sId]) {
          diffs.push({ student_id: sId, published: pubMap[sId], simulated: simMap[sId] });
        }
      }
      comparison = {
        published_round_id: String(published[0]._id),
        differences: diffs,
        difference_count: diffs.length,
      };
    }

    result.comparison = comparison;
    result.note = "Simulation does not write allocation records or change published results.";
    await writeAudit(user._id, "admin", "simulate_allocation", "allocation_round", null);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ detail: err.message }, { status: 400 });
  }
}
