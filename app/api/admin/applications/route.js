import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await requireRole(request, ['admin']);
    const db = await getDatabase();

    const internships = await db.collection('internships').find({}).toArray();
    const students = await db.collection('students').find({}).toArray();
    const users = await db.collection('users').find({}).toArray();

    const internMap = {};
    internships.forEach((i) => { internMap[i._id || i.id] = i; });
    const studentMap = {};
    students.forEach((s) => { studentMap[s._id || s.id] = s; });
    const userMap = {};
    users.forEach((u) => { userMap[u._id || u.id] = u; });

    const apps = await db.collection('applications').find({}).toArray();
    const items = apps.map((app) => {
      const intern = internMap[app.internship_id] || {};
      const student = studentMap[app.student_id] || {};
      const owner = userMap[student.user_id] || {};

      return {
        ...app,
        id: app._id || app.id,
        internship_title: intern.title,
        domain: intern.domain,
        student_name: owner.name || student.full_name,
        branch: student.branch,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'Unauthorized' },
      { status: err.status || 500 }
    );
  }
}
