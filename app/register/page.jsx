'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button, Field, inputClass } from '@/components/common/UI';
import PublicLayout from '@/components/layouts/PublicLayout';

export default function Register() {
  const { register, flash } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await register(form);
      flash('success', 'Account created.');
      router.push('/student');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-bold text-navy-900">Student registration</h1>
        <p className="mt-2 text-sm text-slate-500">Create a student account, then complete your profile before applying.</p>
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
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      </div>
    </PublicLayout>
  );
}
