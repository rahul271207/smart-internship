'use client';
import { useAuth } from '@/context/AuthContext';
import { Button, Card } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminSettings() {
  const { flash } = useAuth();

  async function reset() {
    if (!window.confirm('Reload demonstration data? This clears the current database contents.')) return;
    try {
      await api.post('/api/admin/reset-demo');
      flash('success', 'Demo data restored. Sign in again if needed.');
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    }
  }

  return (
    <DashboardLayout role="admin">
      <Card title="System settings">
        <p className="text-sm text-slate-600">
          Reset restores the deterministic seed used for hackathon demonstrations.
        </p>
        <Button className="mt-4" variant="danger" onClick={reset}>
          Reset demo database
        </Button>
      </Card>
    </DashboardLayout>
  );
}
