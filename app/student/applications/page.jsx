'use client';
import { useEffect, useState } from 'react';
import { Badge, Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function ApplicationsPage() {
  const [apps, setApps] = useState(null);
  useEffect(() => {
    api.get('/api/students/me/applications').then(({ data }) => setApps(data));
  }, []);
  if (!apps) return <DashboardLayout role="student"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="student">
      <Card title="My applications">
        <Table
          rows={apps}
          columns={[
            { key: 'internship_title', label: 'Internship' },
            { key: 'status', label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> },
            {
              key: 'eligibility_result', label: 'Eligible',
              render: (r) => (
                <Badge status={r.eligibility_result?.eligible ? 'eligible' : 'ineligible'}>
                  {r.eligibility_result?.eligible ? 'Yes' : 'No'}
                </Badge>
              ),
            },
            { key: 'match_score', label: 'Match' },
            {
              key: 'applied_at', label: 'Applied',
              render: (r) => r.applied_at ? new Date(r.applied_at).toLocaleDateString() : '',
            },
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
