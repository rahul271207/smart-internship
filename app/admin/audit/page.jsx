'use client';
import { useEffect, useState } from 'react';
import { Button, Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api, { downloadCsv } from '@/lib/apiClient';

export default function AdminAudit() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/api/admin/audit-logs').then(({ data }) => setData(data));
  }, []);
  if (!data) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="admin">
      <Card title="Audit logs" actions={<Button onClick={() => downloadCsv('audit')}>Export CSV</Button>}>
        <Table
          rows={data.items || []}
          columns={[
            {
              key: 'timestamp', label: 'When',
              render: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
            },
            { key: 'actor_role', label: 'Role' },
            { key: 'action', label: 'Action' },
            { key: 'entity_type', label: 'Entity' },
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
