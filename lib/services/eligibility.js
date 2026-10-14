export const ELIGIBILITY_POLICY_VERSION = "eligibility-v1";

function normalize(value) {
  return (value || "").trim().toLowerCase();
}

export function branchTokens(value) {
  const text = normalize(value).replace(/–/g, "-").replace(/—/g, "-");
  const parts = new Set();
  const chunks = text.replace(/[/,\-]/g, " ").split(/\s+/);
  for (const chunk of chunks) {
    if (chunk) parts.add(chunk);
  }
  const aliases = {
    cse: ["cs", "computer", "computerscience"],
    cs: ["cse", "computer"],
    it: ["information", "informationtechnology"],
    cybersecurity: ["cyber", "security", "cse"],
    cyber: ["cybersecurity", "security"],
    ai: ["aids", "aiml", "artificial"],
    ds: ["data", "aids"],
    ece: ["electronics", "communication"],
    eee: ["electrical"],
    me: ["mechanical", "mech"],
    mech: ["mechanical", "me"],
  };
  const expanded = new Set(parts);
  for (const part of parts) {
    if (aliases[part]) {
      aliases[part].forEach((a) => expanded.add(a));
    }
  }
  if (text.includes("cybersecurity") || text.includes("cyber security")) {
    ["cybersecurity", "cyber", "security", "cse"].forEach((t) => expanded.add(t));
  }
  return expanded;
}

export function branchMatches(studentBranch, eligibleBranches) {
  if (!eligibleBranches || eligibleBranches.length === 0) return true;
  const studentTokens = branchTokens(studentBranch);
  if (studentTokens.size === 0) return false;

  for (const allowed of eligibleBranches) {
    const allowedTokens = branchTokens(allowed);
    for (const t of allowedTokens) {
      if (studentTokens.has(t)) return true;
    }
    if (normalize(studentBranch) === normalize(allowed)) return true;
    if (normalize(allowed) && normalize(studentBranch).includes(normalize(allowed))) return true;
  }
  return false;
}

export function evaluateEligibility(student = {}, internship = {}, now = new Date(), applicationTime = null) {
  const conditions = [];

  // 1. CGPA
  const minCgpa = parseFloat(internship.minimum_cgpa || 0);
  const studentCgpa = student.cgpa;
  let cgpaOk = false;
  let cgpaDetail = "";
  if (studentCgpa === undefined || studentCgpa === null || studentCgpa === "") {
    cgpaOk = false;
    cgpaDetail = "Student CGPA is missing.";
  } else {
    cgpaOk = parseFloat(studentCgpa) >= minCgpa;
    cgpaDetail = `Student CGPA ${parseFloat(studentCgpa).toFixed(2)} vs minimum ${minCgpa.toFixed(2)}.`;
  }
  conditions.push({ code: "minimum_cgpa", label: "Minimum CGPA", passed: cgpaOk, detail: cgpaDetail });

  // 2. Branch
  const eligibleBranches = internship.eligible_branches || [];
  const branchOk = branchMatches(student.branch, eligibleBranches);
  conditions.push({
    code: "eligible_branch",
    label: "Eligible academic branch",
    passed: branchOk,
    detail: `Student branch '${student.branch || "unspecified"}' vs allowed ${eligibleBranches.length ? eligibleBranches.join(", ") : "any"}.`,
  });

  // 3. Academic year
  const minYear = internship.minimum_academic_year;
  const studentYear = student.academic_year;
  let yearOk = true;
  let yearDetail = "No minimum academic year is configured.";
  if (minYear !== undefined && minYear !== null) {
    if (studentYear === undefined || studentYear === null) {
      yearOk = false;
      yearDetail = "Student academic year is missing.";
    } else {
      yearOk = parseInt(studentYear, 10) >= parseInt(minYear, 10);
      yearDetail = `Student year ${studentYear} vs required ${minYear}+.`;
    }
  }
  conditions.push({ code: "academic_year", label: "Academic year", passed: yearOk, detail: yearDetail });

  // 4. Deadline
  const deadline = internship.deadline;
  const comparedTime = applicationTime ? new Date(applicationTime) : now;
  let deadlineOk = true;
  let deadlineDetail = "No application deadline is configured.";
  if (deadline) {
    const deadlineDt = new Date(deadline);
    if (isNaN(deadlineDt.getTime())) {
      deadlineOk = true;
      deadlineDetail = "Deadline could not be parsed; treated as open.";
    } else {
      deadlineOk = comparedTime <= deadlineDt;
      deadlineDetail = `Application time ${comparedTime.toISOString()} vs deadline ${deadlineDt.toISOString()}.`;
    }
  }
  conditions.push({ code: "deadline", label: "Application deadline", passed: deadlineOk, detail: deadlineDetail });

  // 5. Availability
  const avail = normalize(student.availability || "available");
  const availOk = ["available", "yes", "true", "immediate", "full-time", "part-time"].includes(avail);
  conditions.push({
    code: "availability",
    label: "Student availability",
    passed: availOk,
    detail: `Availability is '${student.availability || "unspecified"}'.`,
  });

  // 6. Internship open status
  const status = normalize(internship.status || "published");
  const statusOk = ["published", "active", "open"].includes(status);
  conditions.push({
    code: "internship_status",
    label: "Internship is open",
    passed: statusOk,
    detail: `Internship status is '${status}'.`,
  });

  // 7. Mandatory skills
  const mandatorySkills = internship.mandatory_skills || [];
  if (mandatorySkills.length > 0) {
    const studentSkills = new Set(
      (student.skills || []).map((s) => (typeof s === "string" ? normalize(s) : normalize(s.name)))
    );
    const missing = mandatorySkills.filter((s) => !studentSkills.has(normalize(s)));
    const skillOk = missing.length === 0;
    conditions.push({
      code: "mandatory_skills",
      label: "Mandatory skills",
      passed: skillOk,
      detail: skillOk ? "All mandatory skills present." : `Missing mandatory skills: ${missing.join(", ")}.`,
    });
  }

  // 8. Additional conditions
  const additional = internship.additional_conditions || [];
  additional.forEach((rule, index) => {
    if (typeof rule !== "object" || !rule) return;
    const code = rule.code || `additional_${index}`;
    const label = rule.label || code;
    const fieldName = rule.field;
    const expected = rule.equals;
    const actual = fieldName ? student[fieldName] : undefined;
    let passed = true;
    let detail = rule.detail || "Additional condition recorded.";
    if (expected !== undefined) {
      passed = normalize(String(actual)) === normalize(String(expected));
      detail = `Field ${fieldName}='${actual}' vs required '${expected}'.`;
    }
    conditions.push({ code, label, passed, detail });
  });

  const eligible = conditions.every((c) => c.passed);
  return {
    eligible,
    policy_version: ELIGIBILITY_POLICY_VERSION,
    conditions,
    failed_conditions: conditions.filter((c) => !c.passed),
  };
}
