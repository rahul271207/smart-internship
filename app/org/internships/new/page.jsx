'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Field, inputClass } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

const emptyForm = {
  title: '', domain: '', location: '', description: '', duration: '', stipend: '',
  work_mode: 'hybrid', seats: 2, minimum_cgpa: '', minimum_academic_year: 2,
  eligible_branches: '', required_skills: '', preferred_skills: '',
  deadline: '', start_date: '', end_date: '',
};

function toPayload(form) {
  return {
    ...form,
    eligible_branches: form.eligible_branches
      ? form.eligible_branches.split(',').map((s) => s.trim()).filter(Boolean) : [],
    required_skills: form.required_skills
      ? form.required_skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
    preferred_skills: form.preferred_skills
      ? form.preferred_skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
    minimum_cgpa: form.minimum_cgpa === '' ? null : Number(form.minimum_cgpa),
    minimum_academic_year: Number(form.minimum_academic_year),
    seats: Number(form.seats),
    deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
    end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
  };
}

export default function InternshipForm() {
  const { flash } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/internships', toPayload(form));
      flash('success', 'Internship created.');
      setForm(emptyForm);
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardLayout role="organization">
      <form onSubmit={submit} className="space-y-4">
        <h1 className="text-2xl font-bold">Create internship</h1>
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries({
              title: 'Title', domain: 'Domain', location: 'Location',
              duration: 'Duration', stipend: 'Stipend (optional)',
            }).map(([key, label]) => (
              <Field key={key} label={label}>
                <input className={inputClass()} value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </Field>
            ))}
            <Field label="Work mode">
              <select className={inputClass()} value={form.work_mode}
                onChange={(e) => setForm({ ...form, work_mode: e.target.value })}>
                <option value="hybrid">hybrid</option>
                <option value="remote">remote</option>
                <option value="onsite">onsite</option>
              </select>
            </Field>
            <Field label="Seats">
              <input className={inputClass()} type="number" min="1" value={form.seats}
                onChange={(e) => setForm({ ...form, seats: e.target.value })} />
            </Field>
            <Field label="Minimum CGPA">
              <input className={inputClass()} type="number" step="0.1" min="0" max="10"
                value={form.minimum_cgpa}
                onChange={(e) => setForm({ ...form, minimum_cgpa: e.target.value })} />
            </Field>
            <Field label="Minimum year">
              <input className={inputClass()} type="number" min="1" max="6"
                value={form.minimum_academic_year}
                onChange={(e) => setForm({ ...form, minimum_academic_year: e.target.value })} />
            </Field>
            <Field label="Eligible branches">
              <input className={inputClass()} value={form.eligible_branches}
                onChange={(e) => setForm({ ...form, eligible_branches: e.target.value })} />
            </Field>
            <Field label="Required skills">
              <input className={inputClass()} value={form.required_skills}
                onChange={(e) => setForm({ ...form, required_skills: e.target.value })} />
            </Field>
            <Field label="Preferred skills">
              <input className={inputClass()} value={form.preferred_skills}
                onChange={(e) => setForm({ ...form, preferred_skills: e.target.value })} />
            </Field>
            <Field label="Deadline">
              <input className={inputClass()} type="datetime-local" value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Field>
            <Field label="Start date">
              <input className={inputClass()} type="datetime-local" value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </Field>
            <Field label="End date">
              <input className={inputClass()} type="datetime-local" value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className={`${inputClass()} mt-4 min-h-28`} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Button className="mt-4" disabled={busy} type="submit">Publish internship</Button>
        </Card>
      </form>
    </DashboardLayout>
  );
}
