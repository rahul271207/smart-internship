import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Badge, Button, Card, EmptyState, Field, Skeleton, Table, inputClass } from "../../components/common/UI";

function errText(err) {
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.message) return detail.message;
  return "Request failed.";
}

export function StudentDashboard() {
  const { user } = useAuth();
  const student = user?.student;
  const [apps, setApps] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/api/students/me/applications"), api.get("/api/students/me/allocations")])
      .then(([a, r]) => {
        setApps(a.data);
        setResults(r.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  const allocated = results?.results?.find((row) => row.status === "allocated");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Welcome, {student?.full_name || user?.name}</h1>
        <p className="text-sm text-slate-500">Profile completion {student?.profile_completion || 0}%</p>
        <div className="mt-2 h-2 max-w-md overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-navy-800" style={{ width: `${student?.profile_completion || 0}%` }} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Applications"><p className="text-3xl font-bold">{apps.length}</p></Card>
        <Card title="Published results">{results?.published ? <Badge status={allocated ? "allocated" : "pending"}>{allocated ? "Allocated" : "See results"}</Badge> : "Not published"}</Card>
        <Card title="Next step"><Link className="font-semibold text-navy-800" to="/student/internships">Browse internships</Link></Card>
      </div>
    </div>
  );
}

export function StudentProfile({ editable = false }) {
  const { user, refresh, flash } = useAuth();
  const student = user?.student || {};
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/api/students/me").then(({ data }) => {
      setForm({
        full_name: data.full_name || "",
        phone: data.phone || "",
        city: data.city || "",
        state: data.state || "",
        degree: data.degree || "B.Tech",
        branch: data.branch || "",
        institution: data.institution || "",
        academic_year: data.academic_year || 2,
        cgpa: data.cgpa || "",
        graduation_year: data.graduation_year || 2027,
        skills: (data.skills || []).join(", "),
        interests: (data.interests || []).join(", "),
        preferred_domains: (data.preferred_domains || []).join(", "),
        preferred_locations: (data.preferred_locations || []).join(", "),
        work_mode_preference: data.work_mode_preference || "any",
        duration_preference: data.duration_preference || "",
        availability: data.availability || "available",
        projects: data.projects || [],
        certifications: data.certifications || [],
      });
    });
  }, []);

  if (!form) return <Skeleton />;

  async function save(event) {
    event?.preventDefault();
    setBusy(true);
    try {
      await api.put("/api/students/me", {
        ...form,
        academic_year: Number(form.academic_year),
        cgpa: form.cgpa === "" ? null : Number(form.cgpa),
        graduation_year: Number(form.graduation_year),
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
        preferred_domains: form.preferred_domains.split(",").map((s) => s.trim()).filter(Boolean),
        preferred_locations: form.preferred_locations.split(",").map((s) => s.trim()).filter(Boolean),
      });
      await refresh();
      flash("success", "Profile saved. Incomplete profiles are allowed.");
    } catch (err) {
      flash("error", errText(err));
    } finally {
      setBusy(false);
    }
  }

  const fields = [
    ["full_name", "Full name"],
    ["phone", "Phone"],
    ["city", "City"],
    ["state", "State"],
    ["degree", "Degree"],
    ["branch", "Branch"],
    ["institution", "Institution"],
    ["academic_year", "Academic year"],
    ["cgpa", "CGPA (0-10)"],
    ["graduation_year", "Graduation year"],
    ["skills", "Skills (comma separated)"],
    ["interests", "Interests"],
    ["preferred_domains", "Preferred domains"],
    ["preferred_locations", "Preferred locations"],
    ["duration_preference", "Duration preference"],
    ["availability", "Availability"],
  ];

  return (
    <form onSubmit={save} className="space-y-6">
      <h1 className="text-2xl font-bold">{editable ? "Edit profile" : "My profile"}</h1>
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map(([key, label]) => (
            <Field key={key} label={label}>
              <input className={inputClass()} value={form[key]} disabled={!editable} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </Field>
          ))}
          <Field label="Work mode preference">
            <select className={inputClass()} disabled={!editable} value={form.work_mode_preference} onChange={(e) => setForm({ ...form, work_mode_preference: e.target.value })}>
              {["any", "remote", "hybrid", "onsite"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>
        {editable && (
          <Button className="mt-6" disabled={busy} type="submit">
            Save profile
          </Button>
        )}
        {!editable && (
          <Link className="mt-4 inline-block font-semibold text-navy-800" to="/student/profile/edit">
            Edit profile
          </Link>
        )}
      </Card>
    </form>
  );
}

export function InternshipDiscovery() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [workMode, setWorkMode] = useState("");

  function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (domain) params.set("domain", domain);
    if (workMode) params.set("work_mode", workMode);
    api.get(`/api/internships?${params.toString()}`).then(({ data }) => setData(data));
  }

  useEffect(() => {
    load();
  }, []);

  if (!data) return <Skeleton />;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Internship discovery</h1>
      <div className="grid gap-3 md:grid-cols-4">
        <input className={inputClass()} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <input className={inputClass()} placeholder="Domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
        <select className={inputClass()} value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
          <option value="">Any mode</option>
          <option>remote</option>
          <option>hybrid</option>
          <option>onsite</option>
        </select>
        <Button onClick={load}>Filter</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data.items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="text-sm text-slate-500">{item.organization_name} · {item.location}</p>
              </div>
              <Badge status={item.work_mode}>{item.work_mode}</Badge>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-slate-600">{item.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge status={item.eligibility?.eligible ? "eligible" : "ineligible"}>{item.eligibility?.eligible ? "Eligible" : "Ineligible"}</Badge>
              {item.match && <span className="rounded-full bg-slate-100 px-2 py-0.5">Match {item.match.overall}/100</span>}
              <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.seats} seats</span>
            </div>
            <Link className="mt-4 inline-block text-sm font-semibold text-navy-800" to={`/student/internships/${item.id}`}>
              View details
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export function InternshipDetail() {
  const { id } = useParams();
  const { flash } = useAuth();
  const [item, setItem] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/api/internships/${id}`).then(({ data }) => setItem(data));
  }, [id]);

  if (!item) return <Skeleton />;
  const match = item.match;
  async function apply() {
    setBusy(true);
    try {
      await api.post("/api/applications", { internship_id: id });
      flash("success", "Application submitted.");
    } catch (err) {
      flash("error", errText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{item.title}</h1>
      <Card>
        <p className="text-sm text-slate-600">{item.description}</p>
        <dl className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <div>Domain: {item.domain}</div>
          <div>Location: {item.location}</div>
          <div>Mode: {item.work_mode}</div>
          <div>Duration: {item.duration}</div>
          <div>Seats: {item.seats}</div>
          <div>Min CGPA: {item.minimum_cgpa}</div>
          <div>Branches: {(item.eligible_branches || []).join(", ")}</div>
          <div>Required skills: {(item.required_skills || []).join(", ")}</div>
        </dl>
      </Card>
      <Card title="Eligibility">
        <Badge status={item.eligibility?.eligible ? "eligible" : "ineligible"}>{item.eligibility?.status}</Badge>
        <ul className="mt-3 space-y-1 text-sm">
          {(item.eligibility?.conditions || []).map((c) => (
            <li key={c.code} className={c.passed ? "text-emerald-700" : "text-rose-700"}>
              {c.message}
            </li>
          ))}
        </ul>
      </Card>
      {match && (
        <Card title="Compatibility (not a selection probability)">
          <p className="text-3xl font-bold">{match.overall}/100</p>
          <p className="mt-1 text-xs text-slate-500">Method: {match.method}. A high score does not guarantee a seat.</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <BarChart data={Object.entries(match.weighted || {}).map(([name, v]) => ({ name, contribution: v.contribution }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="contribution" fill="#123049" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm text-slate-600">{match.explanation}</p>
        </Card>
      )}
      <Button disabled={busy || !item.eligibility?.eligible} onClick={apply}>
        {item.eligibility?.eligible ? "Apply" : "Not eligible"}
      </Button>
    </div>
  );
}

export function ApplicationsPage() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.get("/api/students/me/applications").then(({ data }) => setRows(data));
  }, []);
  if (!rows) return <Skeleton />;
  return (
    <Card title="My applications">
      <Table
        rows={rows}
        columns={[
          { key: "internship_title", label: "Internship" },
          { key: "status", label: "Status", render: (r) => <Badge status={r.status}>{r.status}</Badge> },
          { key: "match_score", label: "Match" },
          { key: "preference_rank", label: "Pref." },
        ]}
      />
    </Card>
  );
}

export function PreferencesPage() {
  const { flash, refresh } = useAuth();
  const [internships, setInternships] = useState([]);
  const [ranks, setRanks] = useState({});

  useEffect(() => {
    Promise.all([api.get("/api/internships"), api.get("/api/students/me")]).then(([i, s]) => {
      setInternships(i.data.items);
      const map = {};
      (s.data.preferred_internships || []).forEach((p) => {
        map[p.internship_id] = p.rank;
      });
      setRanks(map);
    });
  }, []);

  async function save() {
    const preferred_internships = Object.entries(ranks)
      .filter(([, rank]) => rank)
      .map(([internship_id, rank]) => ({ internship_id, rank: Number(rank) }));
    try {
      await api.put("/api/students/me", { preferred_internships });
      await refresh();
      flash("success", "Preferences saved.");
    } catch (err) {
      flash("error", errText(err));
    }
  }

  return (
    <Card title="Rank internship preferences" actions={<Button onClick={save}>Save ranking</Button>}>
      <p className="mb-4 text-sm text-slate-500">Rank 1 is attempted first during allocation. Unranked internships use a fallback score, not a perfect match.</p>
      <Table
        rows={internships}
        columns={[
          { key: "title", label: "Internship" },
          { key: "domain", label: "Domain" },
          {
            key: "rank",
            label: "Rank",
            render: (row) => (
              <input
                type="number"
                min="1"
                max="20"
                className="w-20 rounded border px-2 py-1"
                value={ranks[row.id] || ""}
                onChange={(e) => setRanks({ ...ranks, [row.id]: e.target.value })}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}

export function ResumePage() {
  const { flash } = useAuth();
  const [extraction, setExtraction] = useState(null);
  const [skills, setSkills] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    try {
      const { data } = await api.post("/api/students/resume", body);
      setExtraction(data.extraction);
      setSkills((data.extraction.skills || []).join(", "));
      flash("success", data.message);
    } catch (err) {
      flash("error", errText(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    try {
      await api.post("/api/students/resume/confirm", {
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        projects: extraction?.projects || [],
        certifications: extraction?.certifications || [],
        overwrite_existing: false,
      });
      flash("success", "Confirmed fields merged into your profile.");
    } catch (err) {
      flash("error", errText(err));
    }
  }

  return (
    <Card title="Resume upload and review">
      <p className="text-sm text-slate-500">PDF only, max 5 MB. Extracted text is untrusted until you review it. Scanned image PDFs cannot be parsed.</p>
      <input className="mt-4" type="file" accept="application/pdf" onChange={upload} />
      {busy && <p className="mt-2 text-sm">Extracting…</p>}
      {extraction && (
        <div className="mt-6 space-y-3">
          {!extraction.ok && <p className="text-rose-700">{extraction.error}</p>}
          <Field label="Extracted skills (edit before confirm)">
            <input className={inputClass()} value={skills} onChange={(e) => setSkills(e.target.value)} />
          </Field>
          <pre className="max-h-48 overflow-auto rounded bg-slate-50 p-3 text-xs">{extraction.text_preview}</pre>
          <Button onClick={confirm}>Confirm and merge</Button>
        </div>
      )}
    </Card>
  );
}

export function MatchAnalysisPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  useEffect(() => {
    if (user?.student?.id) api.get(`/api/matching/student/${user.student.id}`).then(({ data }) => setRows(data));
  }, [user]);
  if (!rows) return <Skeleton />;
  return (
    <Card title="Match analysis">
      <Table
        rows={rows}
        columns={[
          { key: "title", label: "Internship" },
          { key: "elig", label: "Eligibility", render: (r) => <Badge status={r.eligibility.eligible ? "eligible" : "ineligible"}>{r.eligibility.status}</Badge> },
          { key: "score", label: "Score", render: (r) => r.match?.overall ?? "—" },
          { key: "method", label: "Method", render: (r) => r.match?.method || "n/a" },
        ]}
      />
    </Card>
  );
}

export function ResultsPage() {
  const { flash } = useAuth();
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/api/students/me/allocations").then(({ data }) => setData(data));
  }, []);
  if (!data) return <Skeleton />;
  if (!data.published) return <EmptyState title="Results not published" text="Wait for an administrator to publish an allocation round." />;

  async function reject(id) {
    if (!window.confirm("Reject this offer and release the seat to the waitlist?")) return;
    try {
      await api.post("/api/allocation/reject", { allocation_id: id, reason: "offer_rejected" });
      flash("success", "Offer rejected. The seat can be reallocated.");
      const { data: next } = await api.get("/api/students/me/allocations");
      setData(next);
    } catch (err) {
      flash("error", errText(err));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Allocation results</h1>
      {data.results.map((row) => (
        <Card key={row.id} title={row.internship_title || row.internship_id}>
          <Badge status={row.status}>{row.status}</Badge>
          <p className="mt-2 text-sm">Match score {row.match_score}/100 · Preference rank {row.preference_rank ?? "unranked"}</p>
          {row.waitlist_position && <p className="text-sm">Waitlist position {row.waitlist_position}</p>}
          <p className="mt-3 text-sm text-slate-600">{row.explanation?.narrative}</p>
          <ul className="mt-2 text-sm text-slate-500">
            {(row.explanation?.breakdown || []).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {row.status === "allocated" && (
            <Button className="mt-4" variant="danger" onClick={() => reject(row.id)}>
              Reject offer
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}

export function HistoryPage() {
  const [apps, setApps] = useState(null);
  const [alloc, setAlloc] = useState(null);
  useEffect(() => {
    Promise.all([api.get("/api/students/me/applications"), api.get("/api/students/me/allocations")]).then(([a, r]) => {
      setApps(a.data);
      setAlloc(r.data);
    });
  }, []);
  if (!apps) return <Skeleton />;
  return (
    <div className="space-y-6">
      <Card title="Application history">
        <Table rows={apps} columns={[{ key: "internship_title", label: "Internship" }, { key: "status", label: "Status" }, { key: "applied_at", label: "Applied" }]} />
      </Card>
      <Card title="Allocation history">
        {alloc?.published ? <Table rows={alloc.results} columns={[{ key: "internship_title", label: "Internship" }, { key: "status", label: "Status" }, { key: "match_score", label: "Score" }]} /> : <EmptyState title="None published" text="No published round yet." />}
      </Card>
    </div>
  );
}

export function StudentSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <Card title="Account settings">
      <p className="text-sm">Email: {user?.email}</p>
      <p className="mt-2 text-sm">Role: {user?.role}</p>
      <Button className="mt-4" variant="secondary" onClick={() => { logout(); navigate("/"); }}>
        Sign out
      </Button>
    </Card>
  );
}
