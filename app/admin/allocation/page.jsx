'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminAllocation() {
  const { flash } = useAuth();
  const [rounds, setRounds] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api.get('/api/allocation/rounds').then(({ data }) => setRounds(data));
  }
  useEffect(() => { load(); }, []);

  async function runAllocation() {
    setBusy(true);
    try {
      await api.post('/api/allocation/run', { round_name: `Round-${new Date().toISOString().slice(0, 10)}` });
      flash('success', 'Allocation round created.');
      load();
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    } finally {
      setBusy(false);
    }
  }

  async function publish(id) {
    try {
      await api.post(`/api/allocation/rounds/${id}/publish`);
      flash('success', 'Round published.');
      load();
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    }
  }

  if (!rounds) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="admin">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Allocation control</h1>
          <Button disabled={busy} onClick={runAllocation}>
            {busy ? 'Running…' : 'Run new round'}
          </Button>
        </div>
        <Card title="Rounds">
          <Table
            rows={rounds}
            columns={[
              { key: 'round_name', label: 'Round' },
              { key: 'status', label: 'Status' },
              {
                key: 'created_at', label: 'Created',
                render: (r) => r.created_at ? new Date(r.created_at).toLocaleString() : '',
              },
              {
                key: 'actions', label: '',
                render: (r) => r.status !== 'published'
                  ? <Button onClick={() => publish(r.id)}>Publish</Button>
                  : <span className="text-xs text-emerald-700 font-semibold">Published</span>,
              },
            ]}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
