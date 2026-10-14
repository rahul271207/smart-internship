import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await requireRole(request, ['admin']);
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);

    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    const items = await db.collection('audit_logs')
      .find({})
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('audit_logs').countDocuments({});

    return NextResponse.json({
      items: items.map((doc) => ({ ...doc, id: doc._id || doc.id })),
      total,
    });
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'Unauthorized' },
      { status: err.status || 500 }
    );
  }
}
