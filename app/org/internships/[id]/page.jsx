'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function OrgInternshipDetail() {
  const { id } = useParams();
  const { flash } = useAuth();
  const [item, setItem] = useState(null);
  const [apps, setApps] = useState([]);

  useEffect(() => {
    if (id) {
      api.get(`/api/internships/${id}`).then(({ data }) => setItem(data));
      api.get(`/api/applications/internship/${id}`).then(({ data }) => setApps(data));
    }
  }, [id]);

  if (!item) return <DashboardLayout role="organization"><Skeleton /></DashboardLayout>;

  async function close() {
    if (!window.confirm('Close this internship?')) return;
    try {
      await api.delete(`/api/internships/${id}`);
      flash('success', 'Internship closed.');
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    }
  }

  return (
    <DashboardLayout role="organization">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{item.title}</h1>
        <Card>
          <p className="text-sm text-slate-600">{item.description}</p>
          <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
            <p><span className="font-semibold">Seats:</span> {item.seats}</p>
            <p><span className="font-semibold">Domain:</span> {item.domain}</p>
            <p><span className="font-semibold">Status:</span> <Badge status={item.status}>{item.status}</Badge></p>
          </div>
          <Button className="mt-4" variant="danger" onClick={close}>Close internship</Button>
        </Card>
        <Card title="Applicants">
          <Table
            rows={apps}
            columns={[
              { key: 'name', label: 'Student', render: (r) => r.student?.full_name },
              { key: 'branch', label: 'Branch', render: (r) => r.student?.branch },
              { key: 'cgpa', label: 'CGPA', render: (r) => r.student?.cgpa },
              { key: 'match_score', label: 'Match' },
              {
                key: 'elig', label: 'Eligible',
                render: (r) => (
                  <Badge status={r.eligibility_result?.eligible ? 'eligible' : 'ineligible'}>
                    {r.eligibility_result?.eligible ? 'Yes' : 'No'}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
