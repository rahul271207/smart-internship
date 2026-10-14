'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function OrgInternships() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.get('/api/organizations/me/internships').then(({ data }) => setRows(data));
  }, []);
  if (!rows) return <DashboardLayout role="organization"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="organization">
      <Card title="Manage internships">
        <Table
          rows={rows}
          columns={[
            {
              key: 'title', label: 'Title',
              render: (r) => (
                <Link className="font-semibold text-navy-800" href={`/org/internships/${r.id}`}>
                  {r.title}
                </Link>
              ),
            },
            { key: 'seats', label: 'Seats' },
            { key: 'status', label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> },
            { key: 'domain', label: 'Domain' },
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
