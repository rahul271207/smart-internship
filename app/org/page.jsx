'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, Skeleton } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function OrgDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/api/organizations/me/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setStats({}));
  }, []);
  if (!stats) return <DashboardLayout role="organization"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="organization">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy-900">Organization Dashboard</h1>
        <p className="text-slate-500">Welcome, {user?.name}</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Total internships">
            <p className="text-3xl font-bold">{stats.total_internships ?? 0}</p>
          </Card>
          <Card title="Total applications">
            <p className="text-3xl font-bold">{stats.total_applications ?? 0}</p>
          </Card>
          <Card title="Actions">
            <Link href="/org/internships/new" className="font-semibold text-navy-800">
              Create new internship →
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
