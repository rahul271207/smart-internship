import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { seed } from '@/lib/seed';
import { writeAudit } from '@/lib/audit';

export async function POST(request) {
  try {
    const user = await requireRole(request, ['admin']);

    // Reset demo seed
    await seed(true);


    await writeAudit({
      actorId: user.id || user._id,
      actorRole: 'admin',
      action: 'reset_demo_database',
      entityType: 'database',
      entityId: 'all',
      afterState: { reset: true },
    });

    return NextResponse.json({ message: 'Demo database reset successfully.' });
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'Reset failed' },
      { status: err.status || 500 }
    );
  }
}
