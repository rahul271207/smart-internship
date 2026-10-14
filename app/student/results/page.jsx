'use client';
import { useEffect, useState } from 'react';
import { Badge, Card, EmptyState, Skeleton } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function ResultsPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/api/students/me/allocations').then(({ data }) => setData(data));
  }, []);
  if (!data) return <DashboardLayout role="student"><Skeleton /></DashboardLayout>;
  if (!data.published) {
    return (
      <DashboardLayout role="student">
        <EmptyState title="Results not published" text="Wait for an administrator to publish an allocation round." />
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout role="student">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Allocation results</h1>
        {(data.results || []).map((row) => (
          <Card key={row.id} title={row.internship_title || row.internship_id}>
            <Badge status={row.status}>{row.status}</Badge>
            <p className="mt-2 text-sm">
              Match score {row.match_score}/100 · Preference rank {row.preference_rank ?? 'unranked'}
            </p>
            {row.waitlist_position && (
              <p className="text-sm">Waitlist position {row.waitlist_position}</p>
            )}
            <p className="mt-3 text-sm text-slate-600">{row.explanation?.narrative}</p>
            <ul className="mt-2 text-sm text-slate-500">
              {(row.explanation?.breakdown || []).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
