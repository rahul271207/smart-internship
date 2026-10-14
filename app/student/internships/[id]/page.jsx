'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Card, Skeleton } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function InternshipDetail() {
  const { id } = useParams();
  const { flash } = useAuth();
  const [item, setItem] = useState(null);

  useEffect(() => {
    if (id) api.get(`/api/internships/${id}`).then(({ data }) => setItem(data));
  }, [id]);

  if (!item) return <DashboardLayout role="student"><Skeleton /></DashboardLayout>;

  async function apply() {
    try {
      await api.post('/api/applications', { internship_id: id });
      flash('success', 'Application submitted.');
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    }
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
          <p className="text-slate-500">{item.organization_name} · {item.location}</p>
        </div>
        <Card>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <p><span className="font-semibold">Domain:</span> {item.domain}</p>
            <p><span className="font-semibold">Work mode:</span> <Badge status={item.work_mode}>{item.work_mode}</Badge></p>
            <p><span className="font-semibold">Duration:</span> {item.duration}</p>
            <p><span className="font-semibold">Seats:</span> {item.seats}</p>
            <p><span className="font-semibold">Min CGPA:</span> {item.minimum_cgpa || 'None'}</p>
            <p><span className="font-semibold">Eligible branches:</span> {(item.eligible_branches || []).join(', ') || 'All'}</p>
            <p><span className="font-semibold">Required skills:</span> {(item.required_skills || []).join(', ') || 'None'}</p>
            <p><span className="font-semibold">Stipend:</span> {item.stipend || 'Not specified'}</p>
          </div>
          <p className="mt-4 text-sm text-slate-600">{item.description}</p>
          <Button className="mt-4" onClick={apply}>Apply now</Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
