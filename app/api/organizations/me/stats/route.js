import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth.js";
import { getDb } from "@/lib/db.js";

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== "organization") {
    return NextResponse.json({ detail: "Organization authorization required." }, { status: 403 });
  }

  const db = await getDb();
  const org = await db.organizations.findOne({ user_id: user._id });
  if (!org) {
    return NextResponse.json({ detail: "Organization profile not found." }, { status: 404 });
  }

  const internships = await db.internships.find({ organization_id: String(org._id) }).toArray();
  const ids = internships.map((i) => String(i._id));
  const applications = ids.length > 0 ? await db.applications.find({ internship_id: { $in: ids } }).toArray() : [];

  const eligibleCount = applications.filter((a) => a.eligibility_result && a.eligibility_result.eligible).length;
  const totalSeats = internships.reduce((sum, i) => sum + parseInt(i.seats || 0, 10), 0);

  const byInternship = internships.map((i) => ({
    id: String(i._id),
    title: i.title,
    seats: i.seats,
    applications: applications.filter((a) => String(a.internship_id) === String(i._id)).length,
  }));

  return NextResponse.json({
    internships: internships.length,
    seats: totalSeats,
    applications: applications.length,
    eligible: eligibleCount,
    by_internship: byInternship,
  });
}
