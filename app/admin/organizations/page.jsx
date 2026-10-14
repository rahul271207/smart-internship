'use client';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminOrganizations() {
  const [data, setData] = useState(null);
  function load() {
    api.get('/api/admin/organizations').then(({ data }) => setData(data));
  }
  useEffect(() => { load(); }, []);

  async function approve(id, approved) {
    try {
      await api.put(`/api/admin/organizations/${id}/approval`, { approval_status: approved ? 'approved' : 'rejected', approved });
      load();
    } catch (err) {
      console.error(err);
    }
  }

  if (!data) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="admin">
      <Card title={`Organizations (${(data.items || []).length})`}>
        <Table
          rows={data.items || []}
          columns={[
            { key: 'organization_name', label: 'Name' },
            { key: 'email', label: 'Email' },
            {
              key: 'is_approved', label: 'Status',
              render: (r) => (
                <Badge status={r.is_approved ? 'approved' : 'pending'}>
                  {r.is_approved ? 'Approved' : 'Pending'}
                </Badge>
              ),
            },
            {
              key: 'actions', label: '',
              render: (r) => r.is_approved
                ? <Button variant="danger" onClick={() => approve(r.id, false)}>Revoke</Button>
                : <Button onClick={() => approve(r.id, true)}>Approve</Button>,
            },
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
