'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Field, inputClass } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminSimulation() {
  const { flash } = useAuth();
  const [internships, setInternships] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [seats, setSeats] = useState({});
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    api.get('/api/internships?status=all').then(({ data }) => {
      setInternships(data.items || []);
      const map = {};
      (data.items || []).forEach((i) => { map[i.id] = i.seats; });
      setSeats(map);
    });
    api.get('/api/allocation/rounds').then(({ data }) => setRounds(data));
  }, []);

  async function run() {
    const roundId = rounds[0]?.id;
    if (!roundId) {
      flash('error', 'Run an allocation round first.');
      return;
    }
    try {
      const { data } = await api.post(`/api/allocation/rounds/${roundId}/simulate`, {
        seat_overrides: Object.fromEntries(
          Object.entries(seats).map(([k, v]) => [k, Number(v)])
        ),
      });
      setDiff(data);
      flash('success', 'Simulation finished. Published results were not modified.');
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">What-if simulation</h1>
        <Card>
          <p className="mb-4 text-sm text-slate-500">
            Temporarily change seat counts and re-run allocation in memory. Published records stay unchanged.
          </p>
          {internships.map((i) => (
            <Field key={i.id} label={`${i.title} — seats`}>
              <input
                className={inputClass()} type="number" min="0"
                value={seats[i.id] ?? 0}
                onChange={(e) => setSeats({ ...seats, [i.id]: e.target.value })}
              />
            </Field>
          ))}
          <Button className="mt-4" onClick={run}>Run simulation</Button>
        </Card>
        {diff && (
          <Card title="Simulation versus published">
            <p className="text-sm">Unchanged allocations: {diff.diff?.unchanged}</p>
            <p className="text-sm">
              New: {diff.diff?.new_allocations?.length ?? 0} · Removed: {diff.diff?.removed_allocations?.length ?? 0}
            </p>
            <pre className="mt-3 overflow-auto rounded bg-slate-50 p-3 text-xs">
              {JSON.stringify(diff.summary || diff, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
