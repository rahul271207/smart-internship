import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await requireRole(request, ['admin']);
    const db = await getDatabase();

    const users = await db.collection('users').find({ role: 'student' }).toArray();
    const userMap = {};
    users.forEach((u) => { userMap[u._id || u.id] = u; });

    const students = await db.collection('students').find({}).toArray();
    const items = students.map((s) => {
      const owner = userMap[s.user_id] || {};
      return {
        ...s,
        id: s._id || s.id,
        name: owner.name,
        email: owner.email,
        is_active: owner.is_active,
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
