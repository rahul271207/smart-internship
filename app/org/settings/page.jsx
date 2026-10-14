'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Field, inputClass } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function OrgSettings() {
  const { user, refresh, flash } = useAuth();
  const org = user?.organization || {};
  const [form, setForm] = useState({
    organization_name: org.organization_name || '',
    description: org.description || '',
    location: org.location || '',
  });

  async function save() {
    try {
      await api.put('/api/organizations/me', form);
      await refresh();
      flash('success', 'Organization profile updated.');
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    }
  }

  return (
    <DashboardLayout role="organization">
      <Card title="Organization settings">
        <div className="space-y-4">
          <Field label="Name">
            <input className={inputClass()} value={form.organization_name}
              onChange={(e) => setForm({ ...form, organization_name: e.target.value })} />
          </Field>
          <Field label="Location">
            <input className={inputClass()} value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="Description">
            <textarea className={`${inputClass()} min-h-24`} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Button onClick={save}>Save</Button>
        </div>
      </Card>
    </DashboardLayout>
  );
}
