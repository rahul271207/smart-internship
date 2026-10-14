'use client';
import { useEffect, useState } from 'react';
import { Card, Skeleton } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => setData({}));
  }, []);
  if (!data) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  const t = data.totals || data;
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy-900">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Students"><p className="text-3xl font-bold">{t.students ?? data.student_count ?? 0}</p></Card>
          <Card title="Internships"><p className="text-3xl font-bold">{t.internships ?? data.internship_count ?? 0}</p></Card>
          <Card title="Applications"><p className="text-3xl font-bold">{t.applications ?? data.application_count ?? 0}</p></Card>
          <Card title="Organizations"><p className="text-3xl font-bold">{t.organizations ?? data.organization_count ?? 0}</p></Card>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Allocated"><p className="text-2xl font-bold text-emerald-700">{t.allocated ?? 0}</p></Card>
          <Card title="Waitlisted"><p className="text-2xl font-bold text-amber-700">{t.waitlisted ?? 0}</p></Card>
          <Card title="Unallocated"><p className="text-2xl font-bold text-slate-700">{t.unallocated ?? 0}</p></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
