export const MATCHING_POLICY_VERSION = "matching-v1";

export const DEFAULT_WEIGHTS = {
  skills: 30.0,
  academic: 20.0,
  preference: 20.0,
  projects: 10.0,
  location: 10.0,
  certifications: 10.0,
};

export const SKILL_SYNONYMS = {
  python: ["python", "python programming", "python development", "py"],
  javascript: ["javascript", "js", "ecmascript"],
  typescript: ["typescript", "ts"],
  react: ["react", "reactjs", "react.js"],
  node: ["node", "nodejs", "node.js", "express"],
  java: ["java", "core java", "j2ee"],
  "c++": ["c++", "cpp", "c plus plus"],
  c: ["c programming", "c language"],
  sql: ["sql", "mysql", "postgresql", "postgres", "rdbms"],
  mongodb: ["mongodb", "mongo", "nosql"],
  linux: ["linux", "unix", "ubuntu"],
  networking: ["networking", "computer networks", "network security", "ccna"],
  cybersecurity: ["cybersecurity", "cyber security", "infosec", "information security"],
  "machine learning": ["machine learning", "ml", "sklearn", "scikit-learn"],
  "deep learning": ["deep learning", "dl", "neural networks"],
  nlp: ["nlp", "natural language processing", "transformers"],
  "data science": ["data science", "data analysis", "pandas", "numpy"],
  excel: ["excel", "spreadsheets", "ms excel"],
  cad: ["cad", "autocad", "solidworks"],
  plc: ["plc", "scada", "industrial automation"],
  iot: ["iot", "internet of things", "embedded"],
  embedded: ["embedded", "microcontroller", "arduino", "esp32"],
  cloud: ["cloud", "aws", "azure", "gcp"],
  git: ["git", "github", "version control"],
  ui: ["ui", "ux", "figma", "user interface"],
};

export function normalizeSkill(value) {
  let text = (value || "").trim().toLowerCase();
  text = text.replace(/[^a-z0-9+#.\s-]/g, "").replace(/\s+/g, " ");
  for (const [canonical, aliases] of Object.entries(SKILL_SYNONYMS)) {
    if (text === canonical || aliases.includes(text)) {
      return canonical;
    }
    if (text.startsWith(canonical + " ")) {
      return canonical;
    }
  }
  return text;
}

export function studentSkillSet(student = {}) {
  const skills = new Set();
  (student.skills || []).forEach((skill) => {
    if (typeof skill === "string") skills.add(normalizeSkill(skill));
    else if (skill && skill.name) skills.add(normalizeSkill(skill.name));
  });

  (student.projects || []).forEach((project) => {
    const list = project.skills || project.technologies || [];
    list.forEach((s) => skills.add(normalizeSkill(s)));
  });

  const confirmed = student.resume_confirmed || {};
  (confirmed.skills || []).forEach((s) => skills.add(normalizeSkill(s)));

  skills.delete("");
  return skills;
}

export function validateWeights(weights = null) {
  const merged = { ...DEFAULT_WEIGHTS };
  if (weights) {
    for (const key of Object.keys(DEFAULT_WEIGHTS)) {
      if (weights[key] !== undefined) {
        merged[key] = parseFloat(weights[key]);
      }
    }
  }
  if (Object.values(merged).some((val) => val < 0)) {
    throw new Error("Matching weights must be non-negative.");
  }
  const total = Object.values(merged).reduce((a, b) => a + b, 0);
  if (Math.abs(total - 100.0) > 0.05) {
    throw new Error(`Matching weights must sum to 100%. Current total is ${total.toFixed(2)}.`);
  }
  return merged;
}

function roundScore(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function skillScore(student, internship) {
  const skills = studentSkillSet(student);
  const required = (internship.required_skills || []).map(normalizeSkill).filter(Boolean);
  const preferred = (internship.preferred_skills || []).map(normalizeSkill).filter(Boolean);

  const matchedRequired = required.filter((s) => skills.has(s));
  const missingRequired = required.filter((s) => !skills.has(s));
  const matchedPreferred = preferred.filter((s) => skills.has(s));

  const reqRatio = required.length === 0 ? 1.0 : matchedRequired.length / required.length;
  const prefRatio = preferred.length === 0 ? 1.0 : matchedPreferred.length / preferred.length;

  let score = 50.0;
  if (required.length > 0 || preferred.length > 0) {
    score = 100.0 * (0.75 * reqRatio + 0.25 * prefRatio);
  }

  return {
    score: roundScore(score),
    matched_required: matchedRequired,
    missing_required: missingRequired,
    matched_preferred: matchedPreferred,
    method: "keyword",
  };
}

export function academicScore(student, internship, scale = 10.0) {
  const cgpa = student.cgpa;
  const minimum = parseFloat(internship.minimum_cgpa || 0);
  if (cgpa === null || cgpa === undefined || cgpa === "") {
    return { score: 0.0, detail: "CGPA missing; academic factor is 0." };
  }
  const numCgpa = parseFloat(cgpa);
  if (numCgpa < minimum) {
    return { score: 0.0, detail: `CGPA ${numCgpa} is below minimum ${minimum}.` };
  }
  const span = Math.max(scale - minimum, 0.1);
  const ratio = Math.min(Math.max((numCgpa - minimum) / span, 0.0), 1.0);
  const score = 70.0 + 30.0 * ratio;
  return {
    score: roundScore(score),
    detail: `Base 70 for meeting minimum ${minimum}. Remaining 30 scales from ${minimum} to ${scale}. CGPA ${numCgpa} → ${roundScore(score)}.`,
  };
}

export function preferenceScore(student, internship, fallback = 40.0) {
  const internshipId = String(internship._id || internship.id || "");
  const ranked = student.preferred_internships || [];
  let rank = null;

  for (let i = 0; i < ranked.length; i++) {
    const item = ranked[i];
    const val = typeof item === "object" && item ? item.id : item;
    if (String(val) === internshipId) {
      rank = i + 1;
      break;
    }
  }

  if (rank === null) {
    const domains = (student.preferred_domains || []).map((d) => d.toLowerCase());
    const domain = (internship.domain || "").toLowerCase();
    if (domain && domains.includes(domain)) {
      const pos = domains.indexOf(domain) + 1;
      const table = { 1: 90.0, 2: 75.0, 3: 60.0 };
      const score = table[pos] || 50.0;
      return {
        score,
        rank: null,
        detail: `No internship rank set. Domain preference position ${pos} scored ${score}.`,
      };
    }
    if (ranked.length === 0 && domains.length === 0) {
      return {
        score: fallback,
        rank: null,
        detail: `No preferences configured. Fallback score is ${fallback}, not treated as a perfect match.`,
      };
    }
    return {
      score: fallback,
      rank: null,
      detail: `Internship is not in the ranked list. Fallback score is ${fallback}.`,
    };
  }

  const table = { 1: 100.0, 2: 80.0, 3: 60.0 };
  const score = table[rank] || 40.0;
  return {
    score,
    rank,
    detail: `Ranked preference ${rank} maps to score ${score}.`,
  };
}

export function projectScore(student, internship) {
  const projects = student.projects || [];
  if (projects.length === 0) {
    return { score: 20.0, relevant: [], detail: "No projects listed." };
  }

  const targets = new Set(
    [...(internship.required_skills || []), ...(internship.preferred_skills || [])].map(normalizeSkill).filter(Boolean)
  );
  const domain = normalizeSkill(internship.domain || "");
  const relevant = [];
  let hits = 0;

  for (const proj of projects) {
    const blob = `${proj.title || ""} ${proj.description || ""} ${(proj.skills || proj.technologies || []).join(" ")}`.toLowerCase();
    const projSkills = new Set((proj.skills || proj.technologies || []).map(normalizeSkill));
    const matched = [...projSkills].filter((s) => targets.has(s)).sort();
    if (domain && blob.includes(domain)) {
      matched.push(domain);
    }
    if (matched.length > 0 || [...targets].some((t) => blob.includes(t))) {
      hits++;
      relevant.push({ title: proj.title, matched });
    }
  }

  const ratio = hits / Math.max(projects.length, 1);
  const score = hits > 0 ? 40.0 + 60.0 * ratio : 30.0;
  return {
    score: roundScore(Math.min(score, 100.0)),
    relevant,
    detail: `${hits} of ${projects.length} projects overlap internship skills or domain.`,
  };
}

export function locationScore(student, internship) {
  const workMode = (internship.work_mode || "onsite").toLowerCase();
  const prefMode = (student.work_mode_preference || "").toLowerCase();
  const internLoc = (internship.location || "").toLowerCase();
  const prefLocations = (student.preferred_locations || []).map((l) => l.toLowerCase());

  if (workMode === "remote") {
    if (["remote", "hybrid", "any", ""].includes(prefMode)) {
      return { score: 100.0, detail: "Remote internship matches remote/hybrid/unspecified preference." };
    }
    return { score: 60.0, detail: "Remote internship while student prefers onsite." };
  }
  if (internLoc && prefLocations.includes(internLoc)) {
    return { score: 100.0, detail: `Location ${internship.location} is in student preferences.` };
  }
  for (const loc of prefLocations) {
    if (loc && internLoc.includes(loc)) {
      return { score: 90.0, detail: `Preferred location token '${loc}' matches internship location.` };
    }
  }
  if (prefLocations.length === 0 && !prefMode) {
    return { score: 50.0, detail: "No location preference configured; neutral score 50." };
  }
  if (["any", "hybrid"].includes(prefMode)) {
    return { score: 70.0, detail: "Flexible work-mode preference." };
  }
  return { score: 30.0, detail: "Location and work-mode preferences do not match." };
}

export function certificationScore(student, internship) {
  const certs = student.certifications || [];
  const names = certs.map((c) => (typeof c === "string" ? c.toLowerCase() : (c.name || "").toLowerCase()));
  const required = (internship.required_certifications || []).map((c) => c.toLowerCase());

  if (required.length > 0) {
    const matched = required.filter((r) => names.some((n) => n.includes(r)));
    const score = 100.0 * (matched.length / required.length);
    return { score: roundScore(score), detail: `Matched ${matched.length}/${required.length} required certifications.` };
  }

  const keywords = [...(internship.required_skills || []), internship.domain || ""].map(normalizeSkill).filter(Boolean);
  let hits = 0;
  for (const name of names) {
    if (keywords.some((k) => k && name.includes(k))) hits++;
  }
  if (names.length === 0) {
    return { score: 50.0, detail: "No certifications listed; certifications are not mandatory." };
  }
  const score = 70.0 + Math.min(hits, 3) * 10;
  return {
    score: roundScore(Math.min(score, 100.0)),
    detail: `${names.length} certifications recorded; ${hits} overlap role keywords.`,
  };
}

export function calculateMatch(student = {}, internship = {}, weights = null) {
  const validWeights = validateWeights(weights);
  const skills = skillScore(student, internship);
  const academic = academicScore(student, internship);
  const preference = preferenceScore(student, internship);
  const projects = projectScore(student, internship);
  const location = locationScore(student, internship);
  const certifications = certificationScore(student, internship);

  const factors = {
    skills: skills.score,
    academic: academic.score,
    preference: preference.score,
    projects: projects.score,
    location: location.score,
    certifications: certifications.score,
  };

  let overall = 0.0;
  const weighted = {};
  for (const [key, score] of Object.entries(factors)) {
    const contribution = score * (validWeights[key] / 100.0);
    weighted[key] = roundScore(contribution);
    overall += contribution;
  }
  overall = roundScore(overall);

  const method = skills.method;
  const explanation = `Compatibility score ${overall}/100 using ${method} matching. This is a suitability score, not a probability of receiving a seat.`;

  return {
    overall,
    weights: validWeights,
    factors: Object.fromEntries(Object.entries(factors).map(([k, v]) => [k, roundScore(v)])),
    weighted,
    matched_skills: [...(skills.matched_required || []), ...(skills.matched_preferred || [])],
    missing_skills: skills.missing_required || [],
    relevant_projects: projects.relevant || [],
    preference_rank: preference.rank,
    preference_detail: preference.detail,
    academic_detail: academic.detail,
    location_detail: location.detail,
    certification_detail: certifications.detail,
    matching_method: method,
    policy_version: MATCHING_POLICY_VERSION,
    explanation,
  };
}
