'use client';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, Modal, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminResults() {
  const [payload, setPayload] = useState(null);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    api.get('/api/allocation/results').then(({ data }) => setPayload(data));
  }, []);
  if (!payload) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  const rows = payload.results || [];
  return (
    <DashboardLayout role="admin">
      <div className="space-y-4">
        <Card title={`Allocation results (${payload.round?.round_name || 'none'})`}>
          <Table
            rows={rows.filter((r) => r.status === 'allocated')}
            empty="No allocations yet. Run and publish a round."
            columns={[
              { key: 'student_name', label: 'Student' },
              { key: 'internship_title', label: 'Internship' },
              { key: 'match_score', label: 'Score' },
              { key: 'preference_rank', label: 'Pref.' },
              {
                key: 'view', label: '',
                render: (r) => (
                  <Button variant="secondary" onClick={() => setSelected(r)}>Explain</Button>
                ),
              },
            ]}
          />
        </Card>
        <Card title="Unallocated / ineligible">
          <Table
            rows={rows.filter((r) => r.status !== 'allocated' && r.status !== 'waitlisted')}
            columns={[
              { key: 'student_name', label: 'Student' },
              { key: 'internship_title', label: 'Internship' },
              { key: 'status', label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> },
              { key: 'reason_code', label: 'Reason' },
            ]}
          />
        </Card>
        <Modal open={!!selected} title="Allocation explanation" onClose={() => setSelected(null)}>
          {selected && (
            <div className="space-y-2 text-sm">
              <Badge status={selected.status}>{selected.status}</Badge>
              <p>{selected.explanation?.narrative}</p>
              <ul className="list-disc pl-4">
                {(selected.explanation?.breakdown || []).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
