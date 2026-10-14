'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Field, Skeleton, inputClass } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminConfig() {
  const { flash } = useAuth();
  const [config, setConfig] = useState(null);
  useEffect(() => {
    api.get('/api/admin/matching-configuration').then(({ data }) => setConfig(data));
  }, []);
  if (!config) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  const weights = config.matching_weights || {};

  async function save() {
    try {
      await api.put('/api/admin/matching-configuration', weights);
      flash('success', 'Weights saved.');
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    }
  }

  return (
    <DashboardLayout role="admin">
      <Card title="Matching configuration">
        <p className="mb-4 text-sm text-slate-500">
          Weights must be non-negative and sum to 100. These are not official SIH requirements.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.keys(weights).map((key) => (
            <Field key={key} label={key}>
              <input
                className={inputClass()} type="number" step="1" min="0" max="100"
                value={weights[key]}
                onChange={(e) => setConfig({
                  ...config,
                  matching_weights: { ...weights, [key]: Number(e.target.value) },
                })}
              />
            </Field>
          ))}
        </div>
        <Button className="mt-4" onClick={save}>Save weights</Button>
      </Card>
    </DashboardLayout>
  );
}
