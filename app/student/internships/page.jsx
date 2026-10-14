'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, Skeleton, inputClass } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function InternshipDiscovery() {
  const { flash } = useAuth();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState('');
  const [workMode, setWorkMode] = useState('');

  function load() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (domain) params.set('domain', domain);
    if (workMode) params.set('work_mode', workMode);
    api.get(`/api/internships?${params.toString()}`).then(({ data }) => setData(data));
  }
  useEffect(() => { load(); }, []);

  async function apply(id) {
    try {
      await api.post('/api/applications', { internship_id: id });
      flash('success', 'Application submitted.');
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    }
  }

  if (!data) return <DashboardLayout role="student"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="student">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Internship discovery</h1>
        <div className="grid gap-3 md:grid-cols-4">
          <input className={inputClass()} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <input className={inputClass()} placeholder="Domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
          <select className={inputClass()} value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
            <option value="">Any mode</option>
            <option value="remote">remote</option>
            <option value="hybrid">hybrid</option>
            <option value="onsite">onsite</option>
          </select>
          <Button onClick={load}>Filter</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(data.items || []).map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="text-sm text-slate-500">{item.organization_name} · {item.location}</p>
                </div>
                <Badge status={item.work_mode}>{item.work_mode}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.description}</p>
              <div className="mt-3 flex items-center gap-3">
                <Button variant="secondary" onClick={() => apply(item.id)}>Apply</Button>
                <Link href={`/student/internships/${item.id}`} className="text-sm font-semibold text-navy-800">Details →</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
