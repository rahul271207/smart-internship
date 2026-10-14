'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Field, Skeleton, inputClass } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function StudentProfile() {
  const { refresh, flash } = useAuth();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/students/me').then(({ data }) => {
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || '',
        degree: data.degree || 'B.Tech',
        branch: data.branch || '',
        institution: data.institution || '',
        academic_year: data.academic_year || 2,
        cgpa: data.cgpa !== undefined && data.cgpa !== null ? data.cgpa : '',
        graduation_year: data.graduation_year || 2027,
        skills: (data.skills || []).join(', '),
        interests: (data.interests || []).join(', '),
        preferred_domains: (data.preferred_domains || []).join(', '),
        preferred_locations: (data.preferred_locations || []).join(', '),
        work_mode_preference: data.work_mode_preference || 'any',
        duration_preference: data.duration_preference || '',
        availability: data.availability || 'available',
      });
    });
  }, []);

  if (!form) {
    return (
      <DashboardLayout role="student">
        <Skeleton />
      </DashboardLayout>
    );
  }

  async function save(event) {
    event?.preventDefault();
    setBusy(true);
    try {
      await api.put('/api/students/me', {
        ...form,
        academic_year: Number(form.academic_year),
        cgpa: form.cgpa === '' ? null : Number(form.cgpa),
        graduation_year: Number(form.graduation_year),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
        preferred_domains: form.preferred_domains.split(',').map((s) => s.trim()).filter(Boolean),
        preferred_locations: form.preferred_locations.split(',').map((s) => s.trim()).filter(Boolean),
      });
      await refresh();
      flash('success', 'Profile saved.');
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed to save profile.');
    } finally {
      setBusy(false);
    }
  }

  const fields = [
    ['full_name', 'Full name'],
    ['phone', 'Phone'],
    ['city', 'City'],
    ['state', 'State'],
    ['degree', 'Degree'],
    ['branch', 'Branch'],
    ['institution', 'Institution'],
    ['academic_year', 'Academic year'],
    ['cgpa', 'CGPA (0-10)'],
    ['graduation_year', 'Graduation year'],
    ['skills', 'Skills (comma separated)'],
    ['interests', 'Interests'],
    ['preferred_domains', 'Preferred domains'],
    ['preferred_locations', 'Preferred locations'],
    ['duration_preference', 'Duration preference'],
    ['availability', 'Availability'],
  ];

  return (
    <DashboardLayout role="student">
      <form onSubmit={save} className="space-y-6">
        <h1 className="text-2xl font-bold">My profile</h1>
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  className={inputClass()}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </Field>
            ))}
            <Field label="Work mode preference">
              <select
                className={inputClass()}
                value={form.work_mode_preference}
                onChange={(e) => setForm({ ...form, work_mode_preference: e.target.value })}
              >
                {['any', 'remote', 'hybrid', 'onsite'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>
          <Button className="mt-6" disabled={busy} type="submit">
            Save profile
          </Button>
        </Card>
      </form>
    </DashboardLayout>
  );
}
