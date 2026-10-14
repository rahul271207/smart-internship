import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

export async function PUT(request, { params }) {
  try {
    const user = await requireRole(request, ['admin']);
    const db = await getDatabase();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const org = await db.collection('organizations').findOne({ _id: id });
    if (!org) {
      return NextResponse.json({ detail: 'Organization not found.' }, { status: 404 });
    }

    const approval_status = body.approval_status || (body.approved ? 'approved' : 'rejected');
    const is_active = body.is_active !== undefined ? body.is_active : approval_status === 'approved';
    const now = new Date();

    await db.collection('organizations').updateOne(
      { _id: id },
      { $set: { approval_status, updated_at: now } }
    );

    if (org.user_id) {
      await db.collection('users').updateOne(
        { _id: org.user_id },
        { $set: { is_active, updated_at: now } }
      );
    }

    await writeAudit({
      actorId: user.id || user._id,
      actorRole: 'admin',
      action: 'approve_organization',
      entityType: 'organization',
      entityId: id,
      afterState: { approval_status, is_active },
    });

    return NextResponse.json({ id, approval_status, is_active });
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'Unauthorized' },
      { status: err.status || 500 }
    );
  }
}
