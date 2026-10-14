'use client';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, Skeleton } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminMatching() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/api/admin/allocation-analytics')
      .then(({ data }) => setData(data))
      .catch(() => setData({ by_internship: [] }));
  }, []);
  if (!data) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="admin">
      <Card title="Matching analytics — avg score per internship">
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={data.by_internship || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" hide />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(v, n, p) => [`${v}`, p.payload.title]} />
              <Bar dataKey="avg_match_score" fill="#1a4464" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-slate-400">Hover bars to see internship name and average match score.</p>
      </Card>
    </DashboardLayout>
  );
}
