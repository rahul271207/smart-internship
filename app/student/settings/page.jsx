'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button, Card } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function StudentSettings() {
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <DashboardLayout role="student">
      <Card title="Account settings">
        <p className="text-sm">Email: {user?.email}</p>
        <p className="mt-2 text-sm">Role: {user?.role}</p>
        <Button className="mt-4" variant="secondary" onClick={() => { logout(); router.push('/'); }}>
          Sign out
        </Button>
      </Card>
    </DashboardLayout>
  );
}
