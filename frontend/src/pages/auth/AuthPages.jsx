import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button, Field, inputClass } from "../../components/common/UI";

export function Login() {
  const { login, flash } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("aarav@example.com");
  const [password, setPassword] = useState("Student@12345");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await login(email, password);
      flash("success", "Signed in.");
      navigate(data.role === "admin" ? "/admin" : data.role === "organization" ? "/org" : "/student");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold text-navy-900">Sign in</h1>
      <p className="mt-2 text-sm text-slate-500">Use a seeded demo account or a registered student/organization login.</p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{String(error)}</p>}
        <Field label="Email">
          <input className={inputClass()} value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </Field>
        <Field label="Password">
          <input className={inputClass()} value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </Field>
        <Button className="w-full" disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-sm text-slate-500">
          New student? <Link className="font-semibold text-navy-800" to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}

export function Register({ role = "student" }) {
  const { register, flash } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await register(form);
      flash("success", "Account created.");
      navigate(data.role === "organization" ? "/org" : "/student");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold text-navy-900">{role === "organization" ? "Organization access" : "Student registration"}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {role === "organization"
          ? "Organization accounts stay pending until an administrator approves them."
          : "Create a student account, then complete your profile before applying."}
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <Field label="Full name">
          <input className={inputClass()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Email">
          <input className={inputClass()} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Password (min 8 characters)">
          <input className={inputClass()} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        </Field>
        <Button className="w-full" disabled={busy} type="submit">
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
