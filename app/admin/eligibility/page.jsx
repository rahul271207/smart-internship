'use client';
import { useEffect, useState } from 'react';
import { Badge, Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminEligibility() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/api/admin/applications').then(({ data }) => setData(data));
  }, []);
  if (!data) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  const items = (data.items || []).filter((r) => r.eligibility_result);
  return (
    <DashboardLayout role="admin">
      <Card title="Eligibility overview">
        <Table
          rows={items}
          columns={[
            { key: 'student_name', label: 'Student' },
            { key: 'internship_title', label: 'Internship' },
            {
              key: 'eligible', label: 'Eligible',
              render: (r) => (
                <Badge status={r.eligibility_result?.eligible ? 'eligible' : 'ineligible'}>
                  {r.eligibility_result?.eligible ? 'Yes' : 'No'}
                </Badge>
              ),
            },
            { key: 'reason', label: 'Reason', render: (r) => r.eligibility_result?.reason || '' },
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
