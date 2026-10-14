'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function PreferencesPage() {
  const { flash, refresh } = useAuth();
  const [internships, setInternships] = useState([]);
  const [ranks, setRanks] = useState({});

  useEffect(() => {
    Promise.all([api.get('/api/internships'), api.get('/api/students/me')]).then(([i, s]) => {
      setInternships(i.data.items || []);
      const map = {};
      (s.data.preferred_internships || []).forEach((p) => { map[p.internship_id] = p.rank; });
      setRanks(map);
    });
  }, []);

  async function save() {
    const preferred_internships = Object.entries(ranks)
      .filter(([, rank]) => rank)
      .map(([internship_id, rank]) => ({ internship_id, rank: Number(rank) }));
    try {
      await api.put('/api/students/me', { preferred_internships });
      await refresh();
      flash('success', 'Preferences saved.');
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    }
  }

  return (
    <DashboardLayout role="student">
      <Card title="Rank internship preferences" actions={<Button onClick={save}>Save ranking</Button>}>
        <p className="mb-4 text-sm text-slate-500">
          Rank 1 is attempted first during allocation. Unranked internships use a fallback score.
        </p>
        <Table
          rows={internships}
          columns={[
            { key: 'title', label: 'Internship' },
            { key: 'domain', label: 'Domain' },
            {
              key: 'rank', label: 'Rank',
              render: (row) => (
                <input
                  type="number" min="1" max="20"
                  className="w-20 rounded border px-2 py-1"
                  value={ranks[row.id] || ''}
                  onChange={(e) => setRanks({ ...ranks, [row.id]: e.target.value })}
                />
              ),
            },
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
