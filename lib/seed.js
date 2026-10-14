import { config } from "./config.js";
import { getDb } from "./db.js";
import { hashPassword } from "./auth.js";
import { evaluateEligibility } from "./services/eligibility.js";
import { calculateMatch } from "./services/matching.js";
import { getMatchingConfig } from "./services/systemConfig.js";

export const STUDENT_PASSWORD = "Student@12345";
export const ORG_PASSWORD = "Org@12345";

export async function resetDatabase(db) {
  const collections = [
    "users",
    "students",
    "organizations",
    "internships",
    "applications",
    "allocations",
    "allocation_rounds",
    "audit_logs",
    "system_config",
    "resume_jobs",
  ];
  for (const name of collections) {
    await db[name].deleteMany({});
  }
}

export async function seed(reset = true) {
  const db = await getDb();
  if (reset) {
    await resetDatabase(db);
  }

  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 21 * 86400000).toISOString();
  const start = new Date(Date.now() + 40 * 86400000).toISOString();
  const end = new Date(Date.now() + 100 * 86400000).toISOString();

  // 1. Admin Account
  const adminId = "user-admin";
  await db.users.insertOne({
    _id: adminId,
    name: config.adminName,
    email: config.adminEmail,
    password_hash: hashPassword(config.adminPassword),
    role: "admin",
    is_active: true,
    created_at: now,
    updated_at: now,
  });

  // 2. Organizations
  const orgs = [
    ["org-1", "user-org-1", "Aarohan Digital Labs", "Product engineering internships", "Bengaluru"],
    ["org-2", "user-org-2", "Nirbhaya Cyber Works", "Security operations and research", "Hyderabad"],
    ["org-3", "user-org-3", "GridSpark Energy", "Electrical and embedded systems", "Pune"],
  ];
  const orgEmails = {
    "org-1": "org-adl@example.com",
    "org-2": "org-nic@example.com",
    "org-3": "org-grid@example.com",
  };

  for (const [orgId, userId, name, desc, loc] of orgs) {
    await db.users.insertOne({
      _id: userId,
      name: `${name} Coordinator`,
      email: orgEmails[orgId],
      password_hash: hashPassword(ORG_PASSWORD),
      role: "organization",
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    await db.organizations.insertOne({
      _id: orgId,
      user_id: userId,
      organization_name: name,
      description: desc,
      location: loc,
      approval_status: "approved",
      created_at: now,
      updated_at: now,
    });
  }

  // 3. Internships
  const internships = [
    {
      _id: "int-cyber",
      organization_id: "org-2",
      organization_name: "Nirbhaya Cyber Works",
      title: "Cybersecurity Analyst Intern",
      domain: "Cybersecurity",
      description: "Monitor alerts, document incidents, and assist with Linux-based investigations.",
      eligible_branches: ["CSE", "IT", "Cybersecurity"],
      minimum_cgpa: 7.5,
      minimum_academic_year: 2,
      required_skills: ["Python", "Linux"],
      preferred_skills: ["Networking"],
      location: "Hyderabad",
      work_mode: "hybrid",
      duration: "8 weeks",
      seats: 2,
    },
    {
      _id: "int-web",
      organization_id: "org-1",
      organization_name: "Aarohan Digital Labs",
      title: "Full Stack Intern",
      domain: "Software",
      description: "Build React and Next.js features for an internal dashboard.",
      eligible_branches: ["CSE", "IT", "CSBS"],
      minimum_cgpa: 7.0,
      minimum_academic_year: 2,
      required_skills: ["JavaScript", "React"],
      preferred_skills: ["Python"],
      location: "Bengaluru",
      work_mode: "onsite",
      duration: "10 weeks",
      seats: 3,
    },
    {
      _id: "int-ml",
      organization_id: "org-1",
      organization_name: "Aarohan Digital Labs",
      title: "Machine Learning Intern",
      domain: "AI",
      description: "Prototype ranking models and evaluate matching quality.",
      eligible_branches: ["CSE", "AIDS", "AI"],
      minimum_cgpa: 8.0,
      minimum_academic_year: 3,
      required_skills: ["Python", "Machine Learning"],
      preferred_skills: ["NLP"],
      location: "Bengaluru",
      work_mode: "remote",
      duration: "12 weeks",
      seats: 2,
    },
    {
      _id: "int-data",
      organization_id: "org-1",
      organization_name: "Aarohan Digital Labs",
      title: "Data Analytics Intern",
      domain: "Data",
      description: "Clean datasets and produce internship allocation reports.",
      eligible_branches: ["CSE", "IT", "AIDS", "CSBS"],
      minimum_cgpa: 6.5,
      minimum_academic_year: 2,
      required_skills: ["Python", "SQL"],
      preferred_skills: ["Excel"],
      location: "Bengaluru",
      work_mode: "hybrid",
      duration: "8 weeks",
      seats: 2,
    },
    {
      _id: "int-embed",
      organization_id: "org-3",
      organization_name: "GridSpark Energy",
      title: "Embedded Systems Intern",
      domain: "Embedded",
      description: "Work on microcontroller firmware for energy monitors.",
      eligible_branches: ["ECE", "EEE", "CSE"],
      minimum_cgpa: 7.0,
      minimum_academic_year: 2,
      required_skills: ["C", "Embedded"],
      preferred_skills: ["IoT"],
      location: "Pune",
      work_mode: "onsite",
      duration: "8 weeks",
      seats: 2,
    },
    {
      _id: "int-electrical",
      organization_id: "org-3",
      organization_name: "GridSpark Energy",
      title: "Power Systems Intern",
      domain: "Electrical",
      description: "Assist with load-flow studies and documentation.",
      eligible_branches: ["EEE", "Electrical"],
      minimum_cgpa: 7.0,
      minimum_academic_year: 3,
      required_skills: ["PLC"],
      preferred_skills: ["Excel"],
      location: "Pune",
      work_mode: "onsite",
      duration: "6 weeks",
      seats: 1,
    },
    {
      _id: "int-mech",
      organization_id: "org-3",
      organization_name: "GridSpark Energy",
      title: "Mechanical Design Intern",
      domain: "Mechanical",
      description: "CAD modelling for enclosure and thermal fixtures.",
      eligible_branches: ["ME", "Mechanical"],
      minimum_cgpa: 6.8,
      minimum_academic_year: 2,
      required_skills: ["CAD"],
      preferred_skills: ["SolidWorks"],
      location: "Pune",
      work_mode: "hybrid",
      duration: "8 weeks",
      seats: 2,
    },
    {
      _id: "int-ui",
      organization_id: "org-1",
      organization_name: "Aarohan Digital Labs",
      title: "Product Design Intern",
      domain: "Design",
      description: "Improve dashboard usability for students and administrators.",
      eligible_branches: ["CSE", "CSBS", "IT"],
      minimum_cgpa: 6.0,
      minimum_academic_year: 1,
      required_skills: ["UI"],
      preferred_skills: ["JavaScript"],
      location: "Remote",
      work_mode: "remote",
      duration: "8 weeks",
      seats: 1,
    },
    {
      _id: "int-spare",
      organization_id: "org-2",
      organization_name: "Nirbhaya Cyber Works",
      title: "Security Awareness Intern",
      domain: "Cybersecurity",
      description: "Create awareness content. Intentionally larger seat pool for unused-seat demos.",
      eligible_branches: ["CSE", "IT", "CSBS", "Cybersecurity"],
      minimum_cgpa: 6.0,
      minimum_academic_year: 1,
      required_skills: ["Python"],
      preferred_skills: [],
      location: "Hyderabad",
      work_mode: "remote",
      duration: "6 weeks",
      seats: 4,
    },
  ];

  for (const intern of internships) {
    Object.assign(intern, {
      deadline,
      start_date: start,
      end_date: end,
      stipend: "₹12,000 / month",
      additional_conditions: [],
      status: "published",
      created_at: now,
      updated_at: now,
    });
    await db.internships.insertOne(intern);
  }

  // 4. Students
  const students = [
    ["Aarav Sharma", "CSE – Cybersecurity", 8.4, 3, ["Python", "Linux", "Networking"], ["int-cyber", "int-spare"], ["Hyderabad"], "Pune Institute of Cyber Studies"],
    ["Rohan Mehta", "CSE", 9.4, 3, ["Excel", "SQL"], ["int-ml", "int-web"], ["Bengaluru"], "Western College of Engineering"],
    ["Sneha Iyer", "IT", 8.1, 2, ["JavaScript", "React", "Python"], ["int-web", "int-ui"], ["Bengaluru"], "Lakeside Institute of Technology"],
    ["Arjun Nair", "AIDS", 8.8, 3, ["Python", "Machine Learning", "NLP"], ["int-ml", "int-data"], ["Bengaluru"], "Deccan AI College"],
    ["Meera Joshi", "CSBS", 7.2, 2, ["JavaScript", "UI"], ["int-ui", "int-web"], ["Remote"], "Harbour Business Systems School"],
    ["Kabir Singh", "CSE", 7.6, 2, ["Python", "Linux", "Networking"], ["int-cyber", "int-web"], ["Hyderabad"], "Northern Technical University"],
    ["Diya Patel", "IT", 6.9, 2, ["Python", "SQL", "Excel"], ["int-data", "int-spare"], ["Bengaluru"], "Sabarmati Institute"],
    ["Vikram Rao", "ECE", 8.0, 3, ["C", "Embedded", "IoT"], ["int-embed", "int-electrical"], ["Pune"], "Western Circuits College"],
    ["Ananya Das", "EEE", 7.7, 3, ["PLC", "Excel"], ["int-electrical", "int-embed"], ["Pune"], "Eastern Power Institute"],
    ["Harsh Gupta", "Mechanical", 7.1, 2, ["CAD", "SolidWorks"], ["int-mech"], ["Pune"], "Central Mechanical College"],
    ["Paula Fernandes", "CSE", 8.0, 2, ["Python", "Linux"], ["int-cyber", "int-ml"], ["Hyderabad"], "Goa Engineering School"],
    ["Nikhil Verma", "CSE", 8.0, 2, ["Python", "Linux"], ["int-cyber", "int-spare"], ["Hyderabad"], "Yamuna Valley Institute"],
    ["Ishita Bose", "IT", 7.4, 4, ["React", "JavaScript", "Git"], ["int-web", "int-data"], ["Bengaluru"], "Howrah Computing College"],
    ["Farhan Ali", "CSE", 6.4, 2, ["Python", "Linux", "Networking"], ["int-cyber"], ["Hyderabad"], "Deccan Science College"],
    ["Leela Krishnan", "AIDS", 9.1, 3, ["Python", "SQL"], ["int-data", "int-ml"], ["Bengaluru"], "Malabar Data School"],
    ["Omar Sheikh", "CSBS", 7.0, 1, ["UI", "Excel"], ["int-ui"], ["Remote"], "First Year Business Systems College"],
    ["Tanvi Kulkarni", "ECE", 7.3, 2, ["C", "IoT"], ["int-embed"], ["Pune"], "Sahyadri Electronics College"],
    ["Ritika Sharma", "CSE", 8.6, 3, ["Python", "Machine Learning"], ["int-ml", "int-cyber"], ["Bengaluru"], "Shivalik Institute"],
    ["Dev Patel", "IT", 7.8, 2, ["JavaScript", "Python", "SQL"], [], ["Bengaluru"], "Narmada College of IT"],
    ["Sana Qureshi", "Cybersecurity", 8.2, 3, ["Python", "Linux", "Cybersecurity"], ["int-cyber", "int-spare"], ["Hyderabad"], "Pearl City Security School"],
    ["Mohit Jain", "Mechanical", 6.5, 2, ["CAD"], ["int-mech", "int-spare"], ["Pune"], "Desert Mechanical Institute"],
    ["Gayatri Rao", "EEE", 8.3, 4, ["PLC", "Python"], ["int-electrical"], ["Pune"], "Godavari Electrical College"],
  ];

  const internMap = {};
  for (const doc of internships) {
    internMap[doc._id] = doc;
  }

  const { weights } = await getMatchingConfig();

  for (let index = 1; index <= students.length; index++) {
    const [name, branch, cgpa, year, skills, prefs, locations, institution] = students[index - 1];
    const userId = `user-stu-${String(index).padStart(2, "0")}`;
    const studentId = `stu-${String(index).padStart(2, "0")}`;

    const emailOverrides = { 1: "aarav@example.com", 4: "diya@example.com" };
    const email = emailOverrides[index] || `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;

    await db.users.insertOne({
      _id: userId,
      name,
      email,
      password_hash: hashPassword(STUDENT_PASSWORD),
      role: "student",
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    const studentDoc = {
      _id: studentId,
      user_id: userId,
      phone: `+91-90000${String(index).padStart(3, "0")}`,
      city: locations[0] || "Bengaluru",
      state: locations.includes("Bengaluru") ? "Karnataka" : locations.includes("Pune") ? "Maharashtra" : "Telangana",
      degree: "B.E.",
      branch,
      institution,
      academic_year: year,
      cgpa,
      graduation_year: 2027,
      skills,
      interests: skills.slice(0, 2),
      projects: [
        {
          title: `${name.split(" ")[0]} capstone`,
          description: `Applied ${skills.slice(0, 2).join(", ")} on an academic project.`,
          skills: skills.slice(0, 3),
        },
      ],
      certifications: skills.length > 0 ? [{ name: `${skills[0]} fundamentals` }] : [],
      preferred_domains: [],
      preferred_internships: prefs,
      preferred_locations: locations,
      work_mode_preference: "hybrid",
      availability: "available",
      profile_completion: 90,
      created_at: now,
      updated_at: now,
    };
    await db.students.insertOne(studentDoc);

    // Create submitted applications based on student preferences
    for (const internId of prefs) {
      const intern = internMap[internId];
      if (!intern) continue;
      const studentView = { ...studentDoc, name, email };
      const eligibility = evaluateEligibility(studentView, intern);
      const match = calculateMatch(studentView, intern, weights);

      let rank = match.preference_rank;
      if (rank === null) {
        rank = prefs.indexOf(internId) + 1;
      }

      const appId = `app-${studentId}-${internId}`;
      await db.applications.insertOne({
        _id: appId,
        student_id: studentId,
        internship_id: internId,
        status: eligibility.eligible ? "submitted" : "ineligible",
        eligibility_result: eligibility,
        match_score: match.overall,
        match_breakdown: match,
        preference_rank: rank,
        applied_at: now,
        updated_at: now,
      });
    }
  }

  return {
    users: await db.users.countDocuments(),
    students: await db.students.countDocuments(),
    organizations: await db.organizations.countDocuments(),
    internships: await db.internships.countDocuments(),
    applications: await db.applications.countDocuments(),
  };
}

// Auto-seed if empty
export async function ensureSeeded() {
  const db = await getDb();
  const count = await db.internships.countDocuments({});
  if (count === 0) {
    console.log("Empty database detected. Seeding demonstration data...");
    return await seed(true);
  }
}
