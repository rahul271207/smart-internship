import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await requireRole(request, ['admin']);
    const db = await getDatabase();

    const internships = await db.collection('internships').find({}).toArray();
    const applications = await db.collection('applications').find({}).toArray();

    const by_internship = internships.map((i) => {
      const iId = String(i._id || i.id);
      const apps = applications.filter((a) => String(a.internship_id) === iId);
      const scores = apps
        .filter((a) => a.match_score !== undefined && a.match_score !== null)
        .map((a) => parseFloat(a.match_score));
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      return {
        id: iId,
        title: i.title,
        domain: i.domain,
        seats: parseInt(i.seats, 10) || 0,
        applications: apps.length,
        avg_match_score: avg,
      };
    });

    return NextResponse.json({
      by_internship,
      total_internships: internships.length,
      total_applications: applications.length,
    });
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'Unauthorized' },
      { status: err.status || 500 }
    );
  }
}
