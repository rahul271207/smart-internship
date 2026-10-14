'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button, Field, inputClass } from '@/components/common/UI';
import PublicLayout from '@/components/layouts/PublicLayout';

export default function Login() {
  const { login, flash } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin(targetEmail, targetPassword) {
    setBusy(true);
    setError('');
    try {
      const data = await login(targetEmail, targetPassword);
      flash('success', 'Signed in successfully.');
      const role = data.role || data.user?.role || 'student';
      router.push(role === 'admin' ? '/admin' : role === 'organization' ? '/org' : '/student');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    await handleLogin(email, password);
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-bold text-navy-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">
          Click a 1-click demo button below or enter any registered credentials.
        </p>

        {/* 1-Click Fast Login Buttons */}
        <div className="mt-6 rounded-2xl border border-gold-400/50 bg-gradient-to-br from-slate-900 to-navy-950 p-4 text-white shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-400">⚡ 1-Click Fast Sign-In</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleLogin('admin@gmail.com', 'Admin@12345')}
              className="flex items-center justify-between rounded-lg bg-navy-800 px-3 py-2 text-left font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
            >
              <span>👑 Admin</span>
              <span className="text-[10px] text-slate-300">→</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleLogin('aarav@gmail.com', 'Student@12345')}
              className="flex items-center justify-between rounded-lg bg-navy-800 px-3 py-2 text-left font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
            >
              <span>🎓 Aarav (Cyber)</span>
              <span className="text-[10px] text-slate-300">→</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleLogin('diya@gmail.com', 'Student@12345')}
              className="flex items-center justify-between rounded-lg bg-navy-800 px-3 py-2 text-left font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
            >
              <span>🎓 Diya (AI/ML)</span>
              <span className="text-[10px] text-slate-300">→</span>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleLogin('org-nic@gmail.com', 'Org@12345')}
              className="flex items-center justify-between rounded-lg bg-navy-800 px-3 py-2 text-left font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
            >
              <span>🏢 Org (NIC)</span>
              <span className="text-[10px] text-slate-300">→</span>
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{String(error)}</p>}
          <Field label="Email">
            <input
              className={inputClass()}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="text"
              placeholder="e.g. admin@gmail.com or aarav@gmail.com"
              required
            />
          </Field>
          <Field label="Password">
            <input
              className={inputClass()}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </Field>
          <Button className="w-full" disabled={busy} type="submit">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="text-sm text-slate-500">
            New student? <Link className="font-semibold text-navy-800" href="/register">Create an account</Link>
          </p>
        </form>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
          <p className="mb-2 font-semibold text-slate-700">Demo accounts (works with @gmail.com or @example.com):</p>
          <p>Admin: <strong>admin@gmail.com</strong> / <strong>Admin@12345</strong></p>
          <p>Student: <strong>aarav@gmail.com</strong> / <strong>Student@12345</strong></p>
          <p>Student: <strong>diya@gmail.com</strong> / <strong>Student@12345</strong></p>
          <p>Organization: <strong>org-nic@gmail.com</strong> / <strong>Org@12345</strong></p>
        </div>
      </div>
    </PublicLayout>
  );
}
