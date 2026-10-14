import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDatabase } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    await requireRole(request, ['admin']);
    const db = await getDatabase();
    const { kind } = await params;

    let rows = [];
    let fieldnames = [];

    if (kind === 'applications') {
      rows = await db.collection('applications').find({}).toArray();
      fieldnames = ['id', 'student_id', 'internship_id', 'status', 'match_score', 'preference_rank'];
    } else if (kind === 'allocations') {
      const latest = await db.collection('allocation_rounds').findOne({}, { sort: { created_at: -1 } });
      rows = latest
        ? await db.collection('allocations').find({ allocation_round_id: latest._id || latest.id }).toArray()
        : [];
      fieldnames = ['id', 'student_id', 'internship_id', 'status', 'match_score', 'preference_rank', 'waitlist_position'];
    } else if (kind === 'students') {
      rows = await db.collection('students').find({}).toArray();
      fieldnames = ['id', 'user_id', 'branch', 'cgpa', 'institution'];
    } else if (kind === 'audit') {
      rows = await db.collection('audit_logs').find({}).sort({ timestamp: -1 }).limit(500).toArray();
      fieldnames = ['id', 'timestamp', 'actor_role', 'action', 'entity_type', 'entity_id'];
    } else {
      return NextResponse.json({ detail: 'Unsupported export type.' }, { status: 400 });
    }

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = fieldnames.join(',');
    const dataLines = rows.map((row) => {
      return fieldnames
        .map((f) => {
          if (f === 'id') return escapeCsv(row._id || row.id);
          return escapeCsv(row[f]);
        })
        .join(',');
    });

    const csvContent = [headerLine, ...dataLines].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${kind}.csv"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'Export failed' },
      { status: err.status || 500 }
    );
  }
}
