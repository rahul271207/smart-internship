import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getAllocationPolicyConfig, setAllocationPolicyConfig } from '@/lib/services/systemConfig';
import { writeAudit } from '@/lib/audit';

export async function GET(request) {
  try {
    await requireRole(request, ['admin']);
    const policy = await getAllocationPolicyConfig();
    return NextResponse.json({ policy });
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'Unauthorized' },
      { status: err.status || 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await requireRole(request, ['admin']);
    const body = await request.json();

    const result = await setAllocationPolicyConfig(body, user.id || user._id);
    await writeAudit({
      actorId: user.id || user._id,
      actorRole: 'admin',
      action: 'update_allocation_policy',
      entityType: 'system_config',
      entityId: 'allocation_policy',
      afterState: result,
    });

    return NextResponse.json({ policy: result });
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'Failed to update allocation policy' },
      { status: err.status || 400 }
    );
  }
}
