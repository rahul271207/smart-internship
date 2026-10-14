'use client';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, Skeleton } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function OrgStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/api/organizations/me/stats').then(({ data }) => setStats(data));
  }, []);
  if (!stats) return <DashboardLayout role="organization"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="organization">
      <Card title="Internship statistics">
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={stats.by_internship || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="applications" fill="#123049" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
          {(stats.by_internship || []).map((row) => (
            <div key={row.id} className="rounded-lg border border-slate-200 p-3">
              <p className="font-semibold truncate">{row.title}</p>
              <p className="text-slate-500">{row.applications} applications</p>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}
