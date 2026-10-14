'use client';
import { useEffect, useState } from 'react';
import { Card, EmptyState, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function HistoryPage() {
  const [apps, setApps] = useState(null);
  const [alloc, setAlloc] = useState(null);
  useEffect(() => {
    Promise.all([
      api.get('/api/students/me/applications'),
      api.get('/api/students/me/allocations'),
    ]).then(([a, r]) => {
      setApps(a.data);
      setAlloc(r.data);
    });
  }, []);
  if (!apps) return <DashboardLayout role="student"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <Card title="Application history">
          <Table
            rows={apps}
            columns={[
              { key: 'internship_title', label: 'Internship' },
              { key: 'status', label: 'Status' },
              { key: 'applied_at', label: 'Applied' },
            ]}
          />
        </Card>
        <Card title="Allocation history">
          {alloc?.published
            ? (
              <Table
                rows={alloc.results || []}
                columns={[
                  { key: 'internship_title', label: 'Internship' },
                  { key: 'status', label: 'Status' },
                  { key: 'match_score', label: 'Score' },
                ]}
              />
            )
            : <EmptyState title="None published" text="No published round yet." />}
        </Card>
      </div>
    </DashboardLayout>
  );
}
