'use client';
import { useEffect, useState } from 'react';
import { Card, Skeleton, Table } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function AdminStudents() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/api/admin/students').then(({ data }) => setData(data));
  }, []);
  if (!data) return <DashboardLayout role="admin"><Skeleton /></DashboardLayout>;
  return (
    <DashboardLayout role="admin">
      <Card title={`Students (${(data.items || []).length})`}>
        <Table
          rows={data.items || []}
          columns={[
            { key: 'full_name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'branch', label: 'Branch' },
            { key: 'cgpa', label: 'CGPA' },
            { key: 'academic_year', label: 'Year' },
            { key: 'institution', label: 'Institution' },
          ]}
        />
      </Card>
    </DashboardLayout>
  );
}
