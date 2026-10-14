import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await requireRole(request, ['admin']);
    const db = await getDatabase();

    const users = await db.collection('users').find({ role: 'organization' }).toArray();
    const userMap = {};
    users.forEach((u) => { userMap[u._id || u.id] = u; });

    const orgs = await db.collection('organizations').find({}).toArray();
    const items = orgs.map((o) => {
      const owner = userMap[o.user_id] || {};
      return {
        ...o,
        id: o._id || o.id,
        email: owner.email,
        contact_name: owner.name,
        is_active: owner.is_active,
        is_approved: o.approval_status === 'approved',
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
