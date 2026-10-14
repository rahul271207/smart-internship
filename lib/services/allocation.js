export const ALLOCATION_POLICY_VERSION = "allocation-da-v1";

export function createAllocationPolicy(data = {}) {
  return {
    max_internships_per_student: Number(data.max_internships_per_student) || 1,
    waitlist_per_internship: data.waitlist_per_internship !== false,
    tie_break: data.tie_break || "student_id_asc",
    unranked_preference_order: data.unranked_preference_order || "match_score_desc",
    version: data.version || ALLOCATION_POLICY_VERSION,
  };
}

export function applicantSortKeyCompare(a, b, policy) {
  // Higher match score first
  if (b.match_score !== a.match_score) {
    return b.match_score - a.match_score;
  }
  // Tie break
  if (policy.tie_break === "application_id_asc") {
    if (a.application_id !== b.application_id) {
      return a.application_id < b.application_id ? -1 : 1;
    }
    return a.student_tie_key < b.student_tie_key ? -1 : 1;
  }
  // default: student_id_asc
  if (a.student_tie_key !== b.student_tie_key) {
    return a.student_tie_key < b.student_tie_key ? -1 : 1;
  }
  return a.application_id < b.application_id ? -1 : 1;
}

export function studentChoiceCompare(a, b) {
  const rankA = a.preference_rank !== null && a.preference_rank !== undefined ? a.preference_rank : 10000;
  const rankB = b.preference_rank !== null && b.preference_rank !== undefined ? b.preference_rank : 10000;
  if (rankA !== rankB) return rankA - rankB;
  if (b.match_score !== a.match_score) return b.match_score - a.match_score;
  return a.internship_id < b.internship_id ? -1 : 1;
}

export function runDeferredAcceptance(proposals, seatsByInternship, policy = null) {
  const pol = policy ? createAllocationPolicy(policy) : createAllocationPolicy();
  const eligible = proposals.filter((p) => p.eligible);
  const ineligible = proposals.filter((p) => !p.eligible);

  const choices = {};
  for (const item of eligible) {
    if (!choices[item.student_id]) choices[item.student_id] = [];
    choices[item.student_id].push(item);
  }
  for (const studentId of Object.keys(choices)) {
    choices[studentId].sort(studentChoiceCompare);
  }

  const nextIndex = {};
  for (const studentId of Object.keys(choices)) {
    nextIndex[studentId] = 0;
  }

  const free = Object.keys(choices).sort();
  const tentative = {};
  for (const internId of Object.keys(seatsByInternship)) {
    tentative[internId] = [];
  }

  let safety = 0;
  const maxSteps = Math.max(eligible.length * 4, 10);

  while (free.length > 0 && safety < maxSteps) {
    safety++;
    const studentId = free.shift();
    const items = choices[studentId];
    const idx = nextIndex[studentId];
    if (idx >= items.length) continue;

    const proposal = items[idx];
    nextIndex[studentId] = idx + 1;
    const internshipId = proposal.internship_id;
    const capacity = Number(seatsByInternship[internshipId] || 0);

    if (!tentative[internshipId]) tentative[internshipId] = [];
    const current = tentative[internshipId];
    current.push(proposal);
    current.sort((a, b) => applicantSortKeyCompare(a, b, pol));

    if (current.length > capacity) {
      const displaced = current.slice(capacity);
      tentative[internshipId] = current.slice(0, capacity);
      for (const lost of displaced) {
        if (nextIndex[lost.student_id] < choices[lost.student_id].length) {
          if (!free.includes(lost.student_id)) {
            free.push(lost.student_id);
            free.sort();
          }
        }
      }
    } else {
      tentative[internshipId] = current;
    }
  }

  const allocatedApps = [];
  const allocatedStudents = new Set();
  const filled = {};

  for (const [internshipId, kept] of Object.entries(tentative)) {
    filled[internshipId] = kept.length;
    for (const item of kept) {
      allocatedApps.push(item);
      allocatedStudents.add(item.student_id);
    }
  }

  const waitlist = [];
  const unallocated = [];

  for (const [studentId, items] of Object.entries(choices)) {
    if (allocatedStudents.has(studentId)) continue;
    const waitCandidates = items.filter((item) => Number(seatsByInternship[item.internship_id] || 0) > 0);
    waitCandidates.sort(studentChoiceCompare);

    let placed = false;
    if (pol.waitlist_per_internship && waitCandidates.length > 0) {
      const best = waitCandidates[0];
      waitlist.push({
        application_id: best.application_id,
        student_id: best.student_id,
        internship_id: best.internship_id,
        match_score: best.match_score,
        preference_rank: best.preference_rank,
        eligibility: best.eligibility,
        match: best.match,
      });
      placed = true;
    }
    if (!placed) {
      const last = items[items.length - 1];
      if (last) unallocated.push(last);
    }
  }

  waitlist.sort((a, b) => {
    if (b.match_score !== a.match_score) return b.match_score - a.match_score;
    return a.student_id < b.student_id ? -1 : 1;
  });

  const waitlistWithPosition = [];
  const positions = {};
  for (const row of waitlist) {
    const iId = row.internship_id;
    positions[iId] = (positions[iId] || 0) + 1;
    waitlistWithPosition.push({
      ...row,
      waitlist_position: positions[iId],
    });
  }

  const unfilled = {};
  for (const [internshipId, seats] of Object.entries(seatsByInternship)) {
    unfilled[internshipId] = Math.max(Number(seats) - (filled[internshipId] || 0), 0);
  }

  const results = [];
  for (const item of allocatedApps) {
    results.push({
      application_id: item.application_id,
      student_id: item.student_id,
      internship_id: item.internship_id,
      status: "allocated",
      match_score: item.match_score,
      preference_rank: item.preference_rank,
      waitlist_position: null,
      eligibility: item.eligibility,
      match: item.match,
    });
  }
  for (const row of waitlistWithPosition) {
    results.push({ ...row, status: "waitlisted" });
  }
  for (const item of unallocated) {
    results.push({
      application_id: item.application_id,
      student_id: item.student_id,
      internship_id: null,
      status: "unallocated",
      match_score: item.match_score,
      preference_rank: item.preference_rank,
      waitlist_position: null,
      eligibility: item.eligibility,
      match: item.match,
    });
  }
  for (const item of ineligible) {
    results.push({
      application_id: item.application_id,
      student_id: item.student_id,
      internship_id: item.internship_id,
      status: "ineligible",
      match_score: item.match_score,
      preference_rank: item.preference_rank,
      waitlist_position: null,
      eligibility: item.eligibility,
      match: item.match,
    });
  }

  return {
    results,
    filled_seats: filled,
    unfilled_seats: unfilled,
    policy: pol,
    algorithm: "deferred_acceptance",
  };
}

export function validateAllocation(results, seatsByInternship, proposals, policy) {
  const errors = [];
  const allocated = results.filter((r) => r.status === "allocated");
  const byStudent = {};
  const byInternship = {};
  const proposalMap = new Map(proposals.map((p) => [p.application_id, p]));

  for (const row of allocated) {
    const app = proposalMap.get(row.application_id);
    if (!app) {
      errors.push(`Allocated application ${row.application_id} is not in input set.`);
      continue;
    }
    if (!app.eligible) {
      errors.push(`Ineligible application ${row.application_id} was allocated.`);
    }
    if (!row.internship_id) {
      errors.push(`Allocated row ${row.application_id} has no internship.`);
    }
    byStudent[row.student_id] = (byStudent[row.student_id] || 0) + 1;
    byInternship[row.internship_id] = (byInternship[row.internship_id] || 0) + 1;
  }

  for (const [studentId, count] of Object.entries(byStudent)) {
    if (count > policy.max_internships_per_student) {
      errors.push(`Student ${studentId} received ${count} internships.`);
    }
  }
  for (const [internshipId, count] of Object.entries(byInternship)) {
    const cap = Number(seatsByInternship[internshipId] || 0);
    if (count > cap) {
      errors.push(`Internship ${internshipId} filled ${count} of ${cap} seats.`);
    }
  }

  const allowed = new Set(["allocated", "waitlisted", "unallocated", "ineligible", "pending"]);
  for (const row of results) {
    if (!allowed.has(row.status)) {
      errors.push(`Unexpected status: ${row.status}`);
    }
  }
  return errors;
}

export function nextWaitlistedCandidate(waitlistRows, internshipId, alreadyAllocatedStudents) {
  const ranked = waitlistRows.filter(
    (row) =>
      row.internship_id === internshipId &&
      !alreadyAllocatedStudents.has(row.student_id) &&
      ["waitlisted", "unallocated"].includes(row.status)
  );

  ranked.sort((a, b) => {
    const posA = a.waitlist_position || 10000;
    const posB = b.waitlist_position || 10000;
    if (posA !== posB) return posA - posB;
    if (b.match_score !== a.match_score) return b.match_score - a.match_score;
    return a.student_id < b.student_id ? -1 : 1;
  });

  return ranked[0] || null;
}
