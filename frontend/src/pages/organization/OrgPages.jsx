import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Badge, Button, Card, Field, Skeleton, Table, inputClass } from "../../components/common/UI";

function errText(err) {
  const detail = err.response?.data?.detail;
  return typeof detail === "string" ? detail : "Request failed.";
}

export function OrgDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get("/api/organizations/me/stats").then(({ data }) => setStats(data)).catch(() => setStats({ internships: 0, applications: 0, seats: 0, eligible: 0, by_internship: [] }));
  }, []);
  if (!stats) return <Skeleton />;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{user?.organization?.organization_name || user?.name}</h1>
      {user?.organization?.approval_status !== "approved" && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">This organization is pending administrator approval and cannot publish internships yet.</p>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <Card title="Internships"><p className="text-3xl font-bold">{stats.internships}</p></Card>
        <Card title="Seats"><p className="text-3xl font-bold">{stats.seats}</p></Card>
        <Card title="Applications"><p className="text-3xl font-bold">{stats.applications}</p></Card>
        <Card title="Eligible apps"><p className="text-3xl font-bold">{stats.eligible}</p></Card>
      </div>
    </div>
  );
}

const emptyForm = {
  title: "",
  domain: "Software Development",
  description: "Describe the internship responsibilities and learning outcomes.",
  eligible_branches: "CSE, IT",
  minimum_cgpa: 7,
  minimum_academic_year: 2,
  required_skills: "Python",
  preferred_skills: "",
  location: "New Delhi",
  work_mode: "hybrid",
  duration: "8 weeks",
  seats: 2,
  deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
  start_date: new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 16),
  end_date: new Date(Date.now() + 100 * 86400000).toISOString().slice(0, 16),
  stipend: "",
  status: "published",
};

function toPayload(form) {
  return {
    ...form,
    eligible_branches: form.eligible_branches.split(",").map((s) => s.trim()).filter(Boolean),
    required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
    preferred_skills: form.preferred_skills.split(",").map((s) => s.trim()).filter(Boolean),
    minimum_cgpa: Number(form.minimum_cgpa),
    minimum_academic_year: Number(form.minimum_academic_year),
    seats: Number(form.seats),
    deadline: new Date(form.deadline).toISOString(),
    start_date: new Date(form.start_date).toISOString(),
    end_date: new Date(form.end_date).toISOString(),
  };
}

export function InternshipForm() {
  const { flash } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post("/api/internships", toPayload(form));
      flash("success", "Internship created.");
    } catch (err) {
      flash("error", errText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-bold">Create internship</h1>
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries({
            title: "Title",
            domain: "Domain",
            location: "Location",
            duration: "Duration",
            stipend: "Stipend (optional)",
          }).map(([key, label]) => (
            <Field key={key} label={label}>
              <input className={inputClass()} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </Field>
          ))}
          <Field label="Work mode">
            <select className={inputClass()} value={form.work_mode} onChange={(e) => setForm({ ...form, work_mode: e.target.value })}>
              <option>hybrid</option>
              <option>remote</option>
              <option>onsite</option>
            </select>
          </Field>
          <Field label="Seats">
            <input className={inputClass()} type="number" min="1" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} />
          </Field>
          <Field label="Minimum CGPA">
            <input className={inputClass()} type="number" step="0.1" min="0" max="10" value={form.minimum_cgpa} onChange={(e) => setForm({ ...form, minimum_cgpa: e.target.value })} />
          </Field>
          <Field label="Minimum year">
            <input className={inputClass()} type="number" min="1" max="6" value={form.minimum_academic_year} onChange={(e) => setForm({ ...form, minimum_academic_year: e.target.value })} />
          </Field>
          <Field label="Eligible branches">
            <input className={inputClass()} value={form.eligible_branches} onChange={(e) => setForm({ ...form, eligible_branches: e.target.value })} />
          </Field>
          <Field label="Required skills">
            <input className={inputClass()} value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} />
          </Field>
          <Field label="Preferred skills">
            <input className={inputClass()} value={form.preferred_skills} onChange={(e) => setForm({ ...form, preferred_skills: e.target.value })} />
          </Field>
          <Field label="Deadline">
            <input className={inputClass()} type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </Field>
          <Field label="Start">
            <input className={inputClass()} type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </Field>
          <Field label="End">
            <input className={inputClass()} type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </Field>
        </div>
        <Field label="Description">
          <textarea className={`${inputClass()} mt-4 min-h-28`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Button className="mt-4" disabled={busy} type="submit">
          Publish internship
        </Button>
      </Card>
    </form>
  );
}

export function OrgInternships() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.get("/api/organizations/me/internships").then(({ data }) => setRows(data));
  }, []);
  if (!rows) return <Skeleton />;
  return (
    <Card title="Manage internships">
      <Table
        rows={rows}
        columns={[
          { key: "title", label: "Title", render: (r) => <Link className="font-semibold text-navy-800" to={`/org/internships/${r.id}`}>{r.title}</Link> },
          { key: "seats", label: "Seats" },
          { key: "status", label: "Status", render: (r) => <Badge status={r.status}>{r.status}</Badge> },
          { key: "domain", label: "Domain" },
        ]}
      />
    </Card>
  );
}

export function OrgInternshipDetail() {
  const { id } = useParams();
  const { flash } = useAuth();
  const [item, setItem] = useState(null);
  const [apps, setApps] = useState([]);
  useEffect(() => {
    api.get(`/api/internships/${id}`).then(({ data }) => setItem(data));
    api.get(`/api/applications/internship/${id}`).then(({ data }) => setApps(data));
  }, [id]);
  if (!item) return <Skeleton />;
  async function close() {
    await api.delete(`/api/internships/${id}`);
    flash("success", "Internship closed.");
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{item.title}</h1>
      <Card>
        <p className="text-sm text-slate-600">{item.description}</p>
        <Button className="mt-4" variant="danger" onClick={close}>Close internship</Button>
      </Card>
      <Card title="Applicants">
        <Table
          rows={apps}
          columns={[
            { key: "name", label: "Student", render: (r) => r.student?.full_name },
            { key: "branch", label: "Branch", render: (r) => r.student?.branch },
            { key: "cgpa", label: "CGPA", render: (r) => r.student?.cgpa },
            { key: "match_score", label: "Match" },
            { key: "elig", label: "Eligible", render: (r) => <Badge status={r.eligibility_result?.eligible ? "eligible" : "ineligible"}>{r.eligibility_result?.eligible ? "Yes" : "No"}</Badge> },
          ]}
        />
      </Card>
    </div>
  );
}

export function OrgStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get("/api/organizations/me/stats").then(({ data }) => setStats(data));
  }, []);
  if (!stats) return <Skeleton />;
  return (
    <Card title="Internship statistics">
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={stats.by_internship}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="applications" fill="#123049" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function OrgSettings() {
  const { user, refresh, flash } = useAuth();
  const org = user?.organization || {};
  const [form, setForm] = useState({ organization_name: org.organization_name || "", description: org.description || "", location: org.location || "" });
  async function save() {
    try {
      await api.put("/api/organizations/me", form);
      await refresh();
      flash("success", "Organization profile updated.");
    } catch (err) {
      flash("error", errText(err));
    }
  }
  return (
    <Card title="Organization settings">
      <div className="space-y-4">
        <Field label="Name"><input className={inputClass()} value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} /></Field>
        <Field label="Location"><input className={inputClass()} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
        <Field label="Description"><textarea className={`${inputClass()} min-h-24`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Button onClick={save}>Save</Button>
      </div>
    </Card>
  );
}
