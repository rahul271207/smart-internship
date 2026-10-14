'use client';
import { useEffect, useState } from 'react';
import { Badge, Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminApplications() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/api/admin/applications').then(({ data }) => setData(data));
  }, []);
  if (!data) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="admin">
      <Card title={`All applications (${(data.items || []).length})`}>
        <Table
          rows={data.items || []}
          columns={[
            { key: 'student_name', label: 'Student' },
            { key: 'internship_title', label: 'Internship' },
            { key: 'status', label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> },
            { key: 'match_score', label: 'Match' },
            {
              key: 'eligibility_result', label: 'Eligible',
              render: (r) => (
                <Badge status={r.eligibility_result?.eligible ? 'eligible' : 'ineligible'}>
                  {r.eligibility_result?.eligible ? 'Yes' : 'No'}
                </Badge>
              ),
            },
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
