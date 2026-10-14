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
  const [email, setEmail] = useState('aarav@example.com');
  const [password, setPassword] = useState('Student@12345');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await login(email, password);
      flash('success', 'Signed in.');
      router.push(data.role === 'admin' ? '/admin' : data.role === 'organization' ? '/org' : '/student');
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
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
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="text-sm text-slate-500">
            New student? <Link className="font-semibold text-navy-800" href="/register">Create an account</Link>
          </p>
        </form>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-2">Demo accounts (use @gmail.com or @example.com)</p>
          <p>Admin: <strong>admin@gmail.com</strong> / Admin@12345</p>
          <p>Student: <strong>aarav@gmail.com</strong> / Student@12345</p>
          <p>Student: <strong>diya@gmail.com</strong> / Student@12345</p>
          <p>Org: <strong>org-nic@gmail.com</strong> / Org@12345</p>
        </div>
      </div>
    </PublicLayout>
  );
}
