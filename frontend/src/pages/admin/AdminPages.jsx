import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { downloadCsv } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Badge, Button, Card, Field, Modal, Skeleton, Table, inputClass } from "../../components/common/UI";

const COLORS = ["#123049", "#c5a46e", "#0f766e", "#be123c", "#4338ca"];

function errText(err) {
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.message) return `${detail.message}: ${(detail.errors || []).join("; ")}`;
  return "Request failed.";
}

export function AdminDashboard() {
  const [dash, setDash] = useState(null);
  useEffect(() => {
    api.get("/api/admin/dashboard").then(({ data }) => setDash(data));
  }, []);
  if (!dash) return <Skeleton rows={8} />;
  const t = dash.totals;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administrator dashboard</h1>
        <p className="text-sm text-slate-500">Live database totals{dash.using_memory_db ? " (in-memory MongoDB fallback)" : ""}.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(t).map(([k, v]) => (
          <Card key={k}>
            <p className="text-xs uppercase text-slate-500">{k.replaceAll("_", " ")}</p>
            <p className="mt-1 text-2xl font-bold">{v}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Applications by domain">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dash.charts.applications_by_domain}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#123049" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Allocation distribution">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dash.charts.allocation_distribution} dataKey="value" nameKey="name" outerRadius={90}>
                  {dash.charts.allocation_distribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Student branches">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dash.charts.branches}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Match score buckets">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dash.charts.match_score_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#c5a46e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function AdminStudents() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  function load() {
    api.get("/api/admin/students", { params: { q } }).then(({ data }) => setData(data));
  }
  useEffect(() => { load(); }, []);
  if (!data) return <Skeleton />;
  return (
    <Card title="Students" actions={<Button onClick={() => downloadCsv("students")}>Export CSV</Button>}>
      <div className="mb-4 flex gap-2">
        <input className={inputClass()} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or branch" />
        <Button onClick={load}>Search</Button>
      </div>
      <Table rows={data.items} columns={[{ key: "full_name", label: "Name" }, { key: "branch", label: "Branch" }, { key: "cgpa", label: "CGPA" }, { key: "institution", label: "Institution" }]} />
    </Card>
  );
}

export function AdminOrganizations() {
  const { flash } = useAuth();
  const [rows, setRows] = useState(null);
  function load() {
    api.get("/api/admin/organizations").then(({ data }) => setRows(data));
  }
  useEffect(() => { load(); }, []);
  if (!rows) return <Skeleton />;
  async function approve(id) {
    await api.post(`/api/admin/organizations/${id}/approve`);
    flash("success", "Organization approved.");
    load();
  }
  return (
    <Card title="Organizations">
      <Table
        rows={rows}
        columns={[
          { key: "organization_name", label: "Name" },
          { key: "approval_status", label: "Status", render: (r) => <Badge status={r.approval_status}>{r.approval_status}</Badge> },
          { key: "location", label: "Location" },
          { key: "a", label: "", render: (r) => r.approval_status !== "approved" && <Button onClick={() => approve(r.id)}>Approve</Button> },
        ]}
      />
    </Card>
  );
}

export function AdminInternships() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/api/internships", { params: { status: "all" } }).then(({ data }) => setData(data));
  }, []);
  if (!data) return <Skeleton />;
  return (
    <Card title="Internships" actions={<Button onClick={() => downloadCsv("internships")}>Export CSV</Button>}>
      <Table rows={data.items} columns={[{ key: "title", label: "Title" }, { key: "organization_name", label: "Org" }, { key: "seats", label: "Seats" }, { key: "status", label: "Status", render: (r) => <Badge status={r.status}>{r.status}</Badge> }]} />
    </Card>
  );
}

export function AdminApplications() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.get("/api/admin/applications").then(({ data }) => setRows(data));
  }, []);
  if (!rows) return <Skeleton />;
  return (
    <Card title="Applications" actions={<Button onClick={() => downloadCsv("applications")}>Export CSV</Button>}>
      <Table rows={rows} columns={[{ key: "student_id", label: "Student" }, { key: "internship_id", label: "Internship" }, { key: "status", label: "Status" }, { key: "match_score", label: "Score" }]} />
    </Card>
  );
}

export function AdminEligibility() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.get("/api/admin/eligibility").then(({ data }) => setRows(data));
  }, []);
  if (!rows) return <Skeleton />;
  return (
    <Card title="Eligibility monitoring">
      <Table
        rows={rows}
        columns={[
          { key: "student", label: "Student" },
          { key: "internship", label: "Internship" },
          { key: "eligible", label: "Eligible", render: (r) => <Badge status={r.eligible ? "eligible" : "ineligible"}>{r.eligible ? "Yes" : "No"}</Badge> },
          { key: "failed", label: "Failed", render: (r) => (r.failed || []).map((f) => f.message).join("; ") || "—" },
        ]}
      />
    </Card>
  );
}

export function AdminMatching() {
  const [dash, setDash] = useState(null);
  useEffect(() => {
    api.get("/api/admin/dashboard").then(({ data }) => setDash(data));
  }, []);
  if (!dash) return <Skeleton />;
  return (
    <Card title="Matching analytics">
      <p className="mb-4 text-sm text-slate-500">Score distribution from stored application match scores. Compatibility is not a probability.</p>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={dash.charts.match_score_distribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#123049" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function AllocationControl() {
  const { flash } = useAuth();
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("Hackathon demo round");

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const { data } = await api.post("/api/allocation/run", { round_name: name });
      setResult(data);
      flash("success", "Allocation completed and validated on the server.");
    } catch (err) {
      flash("error", errText(err));
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    try {
      await api.post(`/api/allocation/rounds/${result.round.id}/publish`);
      flash("success", "Results published. Students can now view them.");
    } catch (err) {
      flash("error", errText(err));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Allocation control center</h1>
      <Card>
        <Field label="Round name">
          <input className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Button className="mt-4" disabled={busy} onClick={run}>
          Run Smart Allocation
        </Button>
        {stage >= 0 && (
          <ol className="mt-6 space-y-2 text-sm">
            {STAGES.map((label, i) => (
              <li key={label} className={i <= stage ? "font-semibold text-navy-800" : "text-slate-400"}>
                {i < stage ? "✓" : i === stage && busy ? "…" : i === stage ? "✓" : "○"} {label}
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-slate-500">
          The browser waits for FastAPI to finish. Stages complete only after the server returns a validated result.
        </p>
      </Card>
      {result && (
        <Card title="Run summary" actions={<Button onClick={publish}>Publish results</Button>}>
          <pre className="overflow-auto rounded bg-slate-50 p-3 text-xs">{JSON.stringify(result.summary, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
}

export function AdminResults() {
  const [payload, setPayload] = useState(null);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    api.get("/api/allocation/results").then(({ data }) => setPayload(data));
  }, []);
  if (!payload) return <Skeleton />;
  const rows = payload.results || [];
  return (
    <div className="space-y-4">
      <Card title={`Allocation results (${payload.round?.round_name || "none"})`}>
        <Table
          rows={rows.filter((r) => r.status === "allocated")}
          empty="No allocations yet. Run and publish a round."
          columns={[
            { key: "student_name", label: "Student" },
            { key: "internship_title", label: "Internship" },
            { key: "match_score", label: "Score" },
            { key: "preference_rank", label: "Pref." },
            { key: "view", label: "", render: (r) => <Button variant="secondary" onClick={() => setSelected(r)}>Explain</Button> },
          ]}
        />
      </Card>
      <Card title="Unallocated / ineligible">
        <Table
          rows={rows.filter((r) => r.status !== "allocated" && r.status !== "waitlisted")}
          columns={[
            { key: "student_name", label: "Student" },
            { key: "internship_title", label: "Internship" },
            { key: "status", label: "Status", render: (r) => <Badge status={r.status}>{r.status}</Badge> },
            { key: "reason_code", label: "Reason" },
          ]}
        />
      </Card>
      <Modal open={!!selected} title="Allocation explanation" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-2 text-sm">
            <Badge status={selected.status}>{selected.status}</Badge>
            <p>{selected.explanation?.narrative}</p>
            <ul>
              {(selected.explanation?.breakdown || []).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function AdminWaitlist() {
  const { flash } = useAuth();
  const [payload, setPayload] = useState(null);
  function load() {
    api.get("/api/allocation/results").then(({ data }) => setPayload(data));
  }
  useEffect(() => { load(); }, []);
  if (!payload) return <Skeleton />;
  const wait = (payload.results || []).filter((r) => r.status === "waitlisted");
  const allocated = (payload.results || []).filter((r) => r.status === "allocated");
  async function reallocate(id) {
    try {
      await api.post("/api/allocation/reallocate", { allocation_id: id, reason: "offer_rejected" });
      flash("success", "Seat released to the next waitlisted candidate if eligible.");
      load();
    } catch (err) {
      flash("error", errText(err));
    }
  }
  return (
    <div className="space-y-4">
      <Card title="Waitlist">
        <Table rows={wait} columns={[{ key: "student_name", label: "Student" }, { key: "internship_title", label: "Internship" }, { key: "waitlist_position", label: "Position" }, { key: "match_score", label: "Score" }]} />
      </Card>
      <Card title="Allocated offers (reject to reallocate)">
        <Table
          rows={allocated}
          columns={[
            { key: "student_name", label: "Student" },
            { key: "internship_title", label: "Internship" },
            { key: "a", label: "", render: (r) => <Button variant="danger" onClick={() => reallocate(r.id)}>Reject & reallocate</Button> },
          ]}
        />
      </Card>
    </div>
  );
}

export function AdminSimulation() {
  const { flash } = useAuth();
  const [internships, setInternships] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [seats, setSeats] = useState({});
  const [diff, setDiff] = useState(null);
  useEffect(() => {
    api.get("/api/internships", { params: { status: "all" } }).then(({ data }) => {
      setInternships(data.items);
      const map = {};
      data.items.forEach((i) => { map[i.id] = i.seats; });
      setSeats(map);
    });
    api.get("/api/allocation/rounds").then(({ data }) => setRounds(data));
  }, []);
  async function run() {
    const roundId = rounds[0]?.id;
    if (!roundId) {
      flash("error", "Run an allocation round first.");
      return;
    }
    try {
      const { data } = await api.post(`/api/allocation/rounds/${roundId}/simulate`, { seat_overrides: Object.fromEntries(Object.entries(seats).map(([k, v]) => [k, Number(v)])) });
      setDiff(data);
      flash("success", "Simulation finished. Published results were not modified.");
    } catch (err) {
      flash("error", errText(err));
    }
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">What-if simulation</h1>
      <Card>
        <p className="mb-4 text-sm text-slate-500">Temporarily change seat counts and re-run allocation in memory. Published records stay unchanged.</p>
        {internships.map((i) => (
          <Field key={i.id} label={`${i.title} seats`}>
            <input className={inputClass()} type="number" min="0" value={seats[i.id] ?? 0} onChange={(e) => setSeats({ ...seats, [i.id]: e.target.value })} />
          </Field>
        ))}
        <Button className="mt-4" onClick={run}>Run simulation</Button>
      </Card>
      {diff && (
        <Card title="Simulation versus published">
          <p className="text-sm">Published unchanged: {String(diff.published_results_unchanged)}</p>
          <p className="text-sm">Unchanged allocations: {diff.diff?.unchanged}</p>
          <p className="text-sm">New: {diff.diff?.new_allocations?.length} · Removed: {diff.diff?.removed_allocations?.length}</p>
          <pre className="mt-3 overflow-auto rounded bg-slate-50 p-3 text-xs">{JSON.stringify(diff.summary, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
}

export function AdminAudit() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/api/admin/audit-logs").then(({ data }) => setData(data));
  }, []);
  if (!data) return <Skeleton />;
  return (
    <Card title="Audit logs" actions={<Button onClick={() => downloadCsv("audit")}>Export CSV</Button>}>
      <Table rows={data.items} columns={[{ key: "timestamp", label: "When" }, { key: "actor_role", label: "Role" }, { key: "action", label: "Action" }, { key: "entity_type", label: "Entity" }]} />
    </Card>
  );
}

export function AdminConfig() {
  const { flash } = useAuth();
  const [config, setConfig] = useState(null);
  useEffect(() => {
    api.get("/api/admin/matching-configuration").then(({ data }) => setConfig(data));
  }, []);
  if (!config) return <Skeleton />;
  const weights = config.matching_weights;
  async function save() {
    try {
      await api.put("/api/admin/matching-configuration", weights);
      flash("success", "Weights saved.");
    } catch (err) {
      flash("error", errText(err));
    }
  }
  return (
    <Card title="Matching configuration">
      <p className="mb-4 text-sm text-slate-500">Prototype weights must be non-negative and sum to 100. They are not official SIH requirements.</p>
      {Object.keys(weights).map((key) => (
        <Field key={key} label={key}>
          <input className={inputClass()} type="number" value={weights[key]} onChange={(e) => setConfig({ ...config, matching_weights: { ...weights, [key]: Number(e.target.value) } })} />
        </Field>
      ))}
      <Button className="mt-4" onClick={save}>Save weights</Button>
    </Card>
  );
}

export function AdminSettings() {
  const { flash } = useAuth();
  async function reset() {
    if (!window.confirm("Reload demonstration data? This clears the current database contents.")) return;
    try {
      await api.post("/api/admin/reset-demo");
      flash("success", "Demo data restored. Sign in again if needed.");
    } catch (err) {
      flash("error", errText(err));
    }
  }
  return (
    <Card title="System settings">
      <p className="text-sm text-slate-600">Reset restores the deterministic seed used for hackathon demonstrations.</p>
      <Button className="mt-4" variant="danger" onClick={reset}>Reset demo database</Button>
    </Card>
  );
}
