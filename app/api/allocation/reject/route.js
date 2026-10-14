import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';
import { rejectAndReallocate } from '@/lib/services/allocationService';

export async function POST(request) {
  try {
    const user = await requireRole(request, ['student', 'admin']);
    const body = await request.json().catch(() => ({}));
    const allocation_id = body.allocation_id;

    if (!allocation_id) {
      return NextResponse.json({ detail: 'allocation_id is required.' }, { status: 400 });
    }

    const result = await rejectAndReallocate(allocation_id, user.id || user._id);
    await writeAudit({
      actorId: user.id || user._id,
      actorRole: user.role,
      action: 'reject_offer',
      entityType: 'allocation',
      entityId: allocation_id,
      afterState: result,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'Reject failed' },
      { status: err.status || 400 }
    );
  }
}
