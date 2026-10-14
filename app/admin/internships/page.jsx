'use client';
import { useEffect, useState } from 'react';
import { Badge, Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminInternships() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/api/internships?status=all&limit=200').then(({ data }) => setData(data));
  }, []);
  if (!data) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="admin">
      <Card title={`All internships (${(data.items || []).length})`}>
        <Table
          rows={data.items || []}
          columns={[
            { key: 'title', label: 'Title' },
            { key: 'organization_name', label: 'Org' },
            { key: 'seats', label: 'Seats' },
            { key: 'domain', label: 'Domain' },
            { key: 'status', label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> },
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
