'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminWaitlist() {
  const { flash } = useAuth();
  const [payload, setPayload] = useState(null);

  function load() {
    api.get('/api/allocation/results').then(({ data }) => setPayload(data));
  }
  useEffect(() => { load(); }, []);

  async function reallocate(id) {
    if (!window.confirm('Reject this offer and try to reallocate the seat?')) return;
    try {
      await api.post('/api/allocation/reallocate', { allocation_id: id, reason: 'offer_rejected' });
      flash('success', 'Seat released to the next waitlisted candidate if eligible.');
      load();
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    }
  }

  if (!payload) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  const wait = (payload.results || []).filter((r) => r.status === 'waitlisted');
  const allocated = (payload.results || []).filter((r) => r.status === 'allocated');

  return (
    <DashboardLayout role="admin">
      <div className="space-y-4">
        <Card title="Waitlist">
          <Table
            rows={wait}
            columns={[
              { key: 'student_name', label: 'Student' },
              { key: 'internship_title', label: 'Internship' },
              { key: 'waitlist_position', label: 'Position' },
              { key: 'match_score', label: 'Score' },
            ]}
          />
        </Card>
        <Card title="Allocated offers (reject to reallocate)">
          <Table
            rows={allocated}
            columns={[
              { key: 'student_name', label: 'Student' },
              { key: 'internship_title', label: 'Internship' },
              {
                key: 'a', label: '',
                render: (r) => (
                  <Button variant="danger" onClick={() => reallocate(r.id)}>
                    Reject & reallocate
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
