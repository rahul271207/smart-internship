import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getMatchingConfig, setMatchingConfig } from '@/lib/services/systemConfig';
import { writeAudit } from '@/lib/audit';

export async function GET(request) {
  try {
    await requireRole(request, ['admin']);
    const config = await getMatchingConfig();
    return NextResponse.json(config);
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

    const result = await setMatchingConfig(body, user.id || user._id);
    await writeAudit({
      actorId: user.id || user._id,
      actorRole: 'admin',
      action: 'update_matching_weights',
      entityType: 'system_config',
      entityId: 'matching_weights',
      afterState: result,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'Failed to update matching configuration' },
      { status: err.status || 400 }
    );
  }
}
