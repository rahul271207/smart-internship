import { getDb } from "../db.js";
import {
  createAllocationPolicy,
  nextWaitlistedCandidate,
  runDeferredAcceptance,
  validateAllocation,
} from "./allocation.js";
import { evaluateEligibility } from "./eligibility.js";
import { explainResult } from "./explanation.js";
import { calculateMatch } from "./matching.js";
import { getAllocationPolicyConfig, getMatchingConfig } from "./systemConfig.js";

export async function executeAllocationRound({
  initiatedBy,
  roundName = null,
  simulate = false,
  seatOverrides = null,
  weightOverrides = null,
  requirementOverrides = null,
}) {
  const db = await getDb();
  const weights = weightOverrides || (await getMatchingConfig()).weights;
  const policy = await getAllocationPolicyConfig();

  // 1. Load internships
  const rawInternships = await db.internships.find({ status: { $in: ["published", "active", "open"] } }).toArray();
  const reqOver = requirementOverrides || {};
  const internMap = {};
  const seats = {};

  for (const intern of rawInternships) {
    const id = String(intern._id);
    const overlay = reqOver[id] || {};
    const merged = { ...intern, ...overlay };
    internMap[id] = merged;
    seats[id] = seatOverrides && seatOverrides[id] !== undefined
      ? parseInt(seatOverrides[id], 10)
      : parseInt(merged.seats || 0, 10);
  }

  // 2. Load applications & students
  const applications = await db.applications.find({}).toArray();
  const rawStudents = await db.students.find({}).toArray();
  const rawUsers = await db.users.find({}).toArray();

  const studentsMap = {};
  for (const s of rawStudents) {
    studentsMap[String(s._id)] = s;
  }
  const usersMap = {};
  for (const u of rawUsers) {
    usersMap[String(u._id)] = u;
  }

  // 3. Build proposals
  const proposals = [];
  const now = new Date().toISOString();

  for (const app of applications) {
    const student = studentsMap[String(app.student_id)];
    const intern = internMap[String(app.internship_id)];
    if (!student || !intern) continue;

    const user = usersMap[String(student.user_id)] || {};
    const studentView = { ...student, name: user.name, email: user.email };

    const eligibility = evaluateEligibility(studentView, intern);
    const match = calculateMatch(studentView, intern, weights);

    let rank = match.preference_rank;
    if (rank === null || rank === undefined) {
      const preferred = student.preferred_internships || [];
      for (let i = 0; i < preferred.length; i++) {
        const item = preferred[i];
        const val = typeof item === "object" && item ? item.id : item;
        if (String(val) === String(intern._id)) {
          rank = i + 1;
          break;
        }
      }
    }

    proposals.push({
      application_id: String(app._id),
      student_id: String(student._id),
      internship_id: String(intern._id),
      match_score: match.overall,
      preference_rank: rank,
      eligible: eligibility.eligible,
      student_tie_key: String(student._id),
      eligibility,
      match,
    });

    if (!simulate) {
      await db.applications.updateOne(
        { _id: app._id },
        {
          $set: {
            eligibility_result: eligibility,
            match_score: match.overall,
            match_breakdown: match,
            preference_rank: rank,
            status: eligibility.eligible ? "eligible" : "ineligible",
            updated_at: now,
          },
        }
      );
    }
  }

  // 4. Run deferred acceptance algorithm
  const raw = runDeferredAcceptance(proposals, seats, policy);
  const name = roundName || (simulate ? "Simulation" : "Allocation Round");

  const annotated = [];
  for (const row of raw.results) {
    const intern = row.internship_id ? internMap[String(row.internship_id)] : null;
    const explanation = explainResult(row, intern, name, policy.version);
    annotated.push({ ...row, explanation });
  }

  // 5. Validation
  const errors = validateAllocation(annotated, seats, proposals, policy);
  if (errors.length > 0) {
    throw new Error("Allocation validation failed: " + errors.join("; "));
  }

  const totalSeats = Object.values(seats).reduce((a, b) => a + b, 0);
  const summary = {
    allocated: annotated.filter((r) => r.status === "allocated").length,
    waitlisted: annotated.filter((r) => r.status === "waitlisted").length,
    unallocated: annotated.filter((r) => r.status === "unallocated").length,
    ineligible: annotated.filter((r) => r.status === "ineligible").length,
    filled_seats: raw.filled_seats,
    unfilled_seats: raw.unfilled_seats,
    total_seats: totalSeats,
  };

  if (simulate) {
    return {
      simulation: true,
      round_name: name,
      status: "simulated",
      scoring_configuration: weights,
      allocation_policy: policy,
      results: annotated,
      summary,
    };
  }

  // 6. Persist completed round & allocation records
  const roundId = "rnd_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  await db.allocation_rounds.insertOne({
    _id: roundId,
    round_name: name,
    status: "completed",
    scoring_configuration: weights,
    allocation_policy: policy,
    started_at: now,
    completed_at: now,
    published_at: null,
    initiated_by: initiatedBy,
    summary,
    created_at: now,
  });

  for (const row of annotated) {
    await db.allocations.insertOne({
      _id: "alloc_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      allocation_round_id: roundId,
      student_id: row.student_id,
      internship_id: row.internship_id,
      application_id: row.application_id,
      status: row.status,
      match_score: row.match_score,
      preference_rank: row.preference_rank,
      waitlist_position: row.waitlist_position,
      explanation: row.explanation,
      eligibility: row.eligibility,
      match: row.match,
      policy_version: policy.version,
      created_at: now,
      updated_at: now,
    });
  }

  return {
    simulation: false,
    round_id: roundId,
    round_name: name,
    status: "completed",
    scoring_configuration: weights,
    allocation_policy: policy,
    results: annotated,
    summary,
  };
}

export async function publishRound(roundId, actorId) {
  const db = await getDb();
  const roundDoc = await db.allocation_rounds.findOne({ _id: roundId });
  if (!roundDoc) {
    throw new Error("Allocation round not found.");
  }
  if (roundDoc.status === "published") {
    return { round_id: roundId, status: "published", already_published: true };
  }
  if (roundDoc.status !== "completed") {
    throw new Error("Only completed, validated rounds can be published.");
  }
  const now = new Date().toISOString();
  await db.allocation_rounds.updateOne(
    { _id: roundId },
    { $set: { status: "published", published_at: now, published_by: actorId } }
  );
  return { round_id: roundId, status: "published", already_published: false };
}

export async function rejectAndReallocate(allocationId, actorId) {
  const db = await getDb();
  const allocation = await db.allocations.findOne({ _id: allocationId });
  if (!allocation || allocation.status !== "allocated") {
    throw new Error("Only an allocated offer can be rejected.");
  }

  const internId = allocation.internship_id;
  const roundId = allocation.allocation_round_id;
  const now = new Date().toISOString();

  await db.allocations.updateOne(
    { _id: allocationId },
    { $set: { status: "rejected", updated_at: now, rejected_by: actorId } }
  );

  const remaining = await db.allocations.find({ allocation_round_id: roundId }).toArray();
  const allocatedStudents = new Set(remaining.filter((r) => r.status === "allocated").map((r) => r.student_id));
  const waitlistRows = remaining.filter((r) => r.status === "waitlisted");

  const candidate = nextWaitlistedCandidate(waitlistRows, internId, allocatedStudents);
  if (!candidate) {
    return { rejected: allocationId, reallocated_to: null, note: "No eligible waitlisted candidate." };
  }

  const student = await db.students.findOne({ _id: candidate.student_id });
  const intern = await db.internships.findOne({ _id: internId });
  const eligibility = evaluateEligibility(student || {}, intern || {});
  if (!eligibility.eligible) {
    return { rejected: allocationId, reallocated_to: null, note: "Next waitlisted candidate is no longer eligible." };
  }

  const newExplanation = explainResult(
    { ...candidate, status: "allocated", internship_id: internId },
    intern,
    "Reallocation",
    allocation.policy_version || "allocation-da-v1"
  );

  await db.allocations.updateOne(
    { _id: candidate._id },
    {
      $set: {
        status: "allocated",
        internship_id: internId,
        waitlist_position: null,
        updated_at: now,
        reallocated_from: allocationId,
        explanation: newExplanation,
      },
    }
  );

  return {
    rejected: allocationId,
    reallocated_to: String(candidate._id),
    student_id: candidate.student_id,
  };
}
