export function explainResult(result, internship, roundName, policyVersion) {
  const status = result.status;
  const match = result.match || {};
  const eligibility = result.eligibility || {};
  const factors = match.factors || {};
  const weighted = match.weighted || {};
  const internTitle = (internship && internship.title) || "the internship";
  const seats = internship && internship.seats;
  const score = result.match_score;
  const rank = result.preference_rank;

  let narrative = "";
  if (status === "allocated") {
    narrative = `The student satisfied all mandatory eligibility requirements and received a compatibility score of ${score}/100 for ${internTitle}. Preference rank was ${rank !== null && rank !== undefined ? rank : "unranked"}. The internship had available seats under policy ${policyVersion}, and deferred-acceptance retained this applicant within capacity during ${roundName}.`;
  } else if (status === "waitlisted") {
    const position = result.waitlist_position;
    narrative = `The student is eligible for ${internTitle} with compatibility ${score}/100 (preference rank ${rank !== null && rank !== undefined ? rank : "unranked"}). All ${seats} seats were filled by higher-priority applicants under the configured policy. Waitlist position: ${position}.`;
  } else if (status === "ineligible") {
    const failed = eligibility.failed_conditions || [];
    const names = failed.map((f) => f.detail || f.label).join("; ") || "one or more mandatory rules";
    narrative = `The student was not considered for allocation because eligibility failed: ${names}`;
  } else if (status === "unallocated") {
    narrative = `The student remained eligible but was not allocated. Remaining preferred internships were full or unavailable after deferred-acceptance proposals in ${roundName}. Compatibility score ${score}/100 is not a selection probability.`;
  } else {
    narrative = `Status is ${status}. No final allocation decision has been published.`;
  }

  return {
    status,
    internship_title: ["allocated", "waitlisted", "ineligible"].includes(status) ? internTitle : null,
    match_score: score,
    preference_rank: rank,
    waitlist_position: result.waitlist_position,
    round_name: roundName,
    policy_version: policyVersion,
    eligibility,
    factors,
    weighted,
    matching_method: match.matching_method || "keyword",
    summary: narrative,
    narrative,
    breakdown: [
      `Skills contribution: ${weighted.skills || 0}`,
      `Academic contribution: ${weighted.academic || 0}`,
      `Preference contribution: ${weighted.preference || 0}`,
      `Projects contribution: ${weighted.projects || 0}`,
      `Location contribution: ${weighted.location || 0}`,
      `Certifications contribution: ${weighted.certifications || 0}`,
    ],
    confidentiality_note: "Details about other applicants are omitted.",
  };
}
