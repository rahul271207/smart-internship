'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function MatchAnalysisPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  useEffect(() => {
    if (user?.student?.id) {
      api.get(`/api/matching/student/${user.student.id}`).then(({ data }) => setRows(data));
    }
  }, [user]);
  if (!rows) return <DashboardLayout role="student"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="student">
      <Card title="Match analysis">
        <Table
          rows={rows}
          columns={[
            { key: 'title', label: 'Internship' },
            {
              key: 'elig', label: 'Eligibility',
              render: (r) => (
                <Badge status={r.eligibility?.eligible ? 'eligible' : 'ineligible'}>
                  {r.eligibility?.status}
                </Badge>
              ),
            },
            { key: 'score', label: 'Score', render: (r) => r.match?.overall ?? '—' },
            { key: 'method', label: 'Method', render: (r) => r.match?.method || 'n/a' },
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
