'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card, Skeleton } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const student = user?.student;
  const [apps, setApps] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'student') {
      router.replace(user.role === 'admin' ? '/admin' : '/org');
      return;
    }
    Promise.all([
      api.get('/api/students/me/applications'),
      api.get('/api/students/me/allocations'),
    ])
      .then(([a, r]) => {
        setApps(a.data || []);
        setResults(r.data);
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  if (loading) {
    return (
      <DashboardLayout role="student">
        <Skeleton />
      </DashboardLayout>
    );
  }

  const allocated = results?.results?.find((row) => row.status === 'allocated');

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            Welcome, {student?.full_name || user?.name}
          </h1>
          <p className="text-sm text-slate-500">
            Profile completion {student?.profile_completion || 0}%
          </p>
          <div className="mt-2 h-2 max-w-md overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-navy-800"
              style={{ width: `${student?.profile_completion || 0}%` }}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Applications">
            <p className="text-3xl font-bold">{apps.length}</p>
          </Card>
          <Card title="Published results">
            {results?.published ? (
              <Badge status={allocated ? 'allocated' : 'pending'}>
                {allocated ? 'Allocated' : 'See results'}
              </Badge>
            ) : (
              'Not published'
            )}
          </Card>
          <Card title="Next step">
            <Link className="font-semibold text-navy-800" href="/student/internships">
              Browse internships →
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
