import pdfParse from "pdf-parse";
import { normalizeSkill } from "./matching.js";

export const KNOWN_SKILLS = [
  "python",
  "java",
  "javascript",
  "typescript",
  "react",
  "node",
  "sql",
  "mongodb",
  "linux",
  "networking",
  "cybersecurity",
  "machine learning",
  "deep learning",
  "nlp",
  "data science",
  "excel",
  "cad",
  "autocad",
  "solidworks",
  "plc",
  "iot",
  "embedded",
  "aws",
  "azure",
  "git",
  "c++",
  "html",
  "css",
  "fastapi",
  "django",
  "flask",
];

export async function extractResume(fileBuffer, filename = "resume.pdf") {
  let text = "";
  let method = "pdf-parse";
  let error = null;

  try {
    const data = await pdfParse(fileBuffer);
    text = (data.text || "").trim();
  } catch (err) {
    error = err.message;
  }

  if (!text) {
    return {
      status: "no_text",
      method,
      error: error || "No extractable text. Scanned or image-only PDFs are not parsed automatically.",
      text_preview: "",
      skills: [],
      education: [],
      projects: [],
      certifications: [],
      needs_review: true,
      filename,
    };
  }

  const sections = splitSections(text);
  const skills = extractSkills(text);
  const education = extractLines(sections.education || text, 6);
  const projects = extractProjects(sections.projects || "");
  const certifications = extractLines(sections.certifications || sections.certificates || "", 8);

  return {
    status: "extracted",
    method,
    error: null,
    text_preview: text.slice(0, 2500),
    skills,
    education,
    projects,
    certifications,
    needs_review: true,
    filename,
    note: "Extracted fields are unverified. Review and confirm before they affect matching.",
  };
}

function splitSections(text) {
  const headers = ["education", "skills", "projects", "experience", "certifications", "certificates", "achievements"];
  const regex = new RegExp(`^(?:${headers.join("|")})\\b[:\\s]*$`, "gim");
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({ index: match.index, end: regex.lastIndex, text: match[0] });
  }

  const sections = {};
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const name = m.text.trim().toLowerCase().replace(/:$/, "");
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    sections[name] = text.slice(m.end, end).trim();
  }
  return sections;
}

function extractSkills(text) {
  const lower = text.toLowerCase();
  const matched = new Set();
  for (const skill of KNOWN_SKILLS) {
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(lower)) {
      matched.add(normalizeSkill(skill));
    }
  }
  return Array.from(matched).sort();
}

function extractLines(sectionText, limit = 6) {
  if (!sectionText) return [];
  return sectionText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 3)
    .slice(0, limit);
}

function extractProjects(sectionText) {
  if (!sectionText) return [];
  const lines = sectionText.split("\n").map((l) => l.trim()).filter(Boolean);
  const projects = [];
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (line.length > 5 && !line.toLowerCase().startsWith("project")) {
      projects.push({ title: line.slice(0, 80), description: line });
    }
  }
  return projects;
}
