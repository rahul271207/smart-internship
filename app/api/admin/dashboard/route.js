import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDatabase } from '@/lib/db';

export async function GET(request) {
  try {
    await requireRole(request, ['admin']);
    const db = await getDatabase();

    const internships = await db.collection('internships').find({}).toArray();
    const applications = await db.collection('applications').find({}).toArray();
    const students = await db.collection('students').find({}).toArray();
    const latest = await db.collection('allocation_rounds').findOne({}, { sort: { created_at: -1 } });

    const allocations = latest
      ? await db.collection('allocations').find({ allocation_round_id: latest._id || latest.id }).toArray()
      : [];

    const total_seats = internships
      .filter((i) => ['published', 'active', 'open'].includes(i.status))
      .reduce((sum, i) => sum + (parseInt(i.seats, 10) || 0), 0);

    const filled = allocations.filter((a) => a.status === 'allocated').length;
    const eligible = applications.filter((a) => a.eligibility_result && a.eligibility_result.eligible).length;
    const ineligible = applications.filter(
      (a) => a.eligibility_result && !a.eligibility_result.eligible
    ).length;

    const domain_counts = {};
    internships.forEach((i) => {
      const d = i.domain || 'unspecified';
      domain_counts[d] = (domain_counts[d] || 0) + 1;
    });

    const app_domains = {};
    const intern_map = {};
    internships.forEach((i) => { intern_map[i._id || i.id] = i; });
    applications.forEach((a) => {
      const intern = intern_map[a.internship_id] || {};
      const d = intern.domain || 'unspecified';
      app_domains[d] = (app_domains[d] || 0) + 1;
    });

    const branches = {};
    students.forEach((s) => {
      const b = s.branch || 'unspecified';
      branches[b] = (branches[b] || 0) + 1;
    });

    const eligibility_chart = {
      eligible,
      ineligible,
      pending: Math.max(applications.length - eligible - ineligible, 0),
    };

    const allocation_chart = {};
    allocations.forEach((a) => {
      const s = a.status || 'pending';
      allocation_chart[s] = (allocation_chart[s] || 0) + 1;
    });

    const buckets = { '0-49': 0, '50-69': 0, '70-84': 0, '85-100': 0 };
    applications.forEach((a) => {
      if (a.match_score !== undefined && a.match_score !== null) {
        const sc = parseFloat(a.match_score);
        if (sc < 50) buckets['0-49']++;
        else if (sc < 70) buckets['50-69']++;
        else if (sc < 85) buckets['70-84']++;
        else buckets['85-100']++;
      }
    });

    const filled_by_intern = {};
    allocations.forEach((a) => {
      if (a.status === 'allocated') {
        const iId = String(a.internship_id);
        filled_by_intern[iId] = (filled_by_intern[iId] || 0) + 1;
      }
    });

    const utilization = internships.map((i) => {
      const seats = parseInt(i.seats, 10) || 0;
      const used = filled_by_intern[String(i._id || i.id)] || 0;
      return {
        title: i.title,
        seats,
        filled: used,
        unfilled: Math.max(seats - used, 0),
      };
    });

    const studentUserCount = await db.collection('users').countDocuments({ role: 'student' });
    const orgCount = await db.collection('organizations').countDocuments({});
    const publishedInternCount = internships.filter((i) => ['published', 'active', 'open'].includes(i.status)).length;

    return NextResponse.json({
      totals: {
        students: studentUserCount,
        organizations: orgCount,
        internships: publishedInternCount,
        applications: applications.length,
        eligible_applications: eligible,
        ineligible_applications: ineligible,
        allocated: allocations.filter((a) => a.status === 'allocated').length,
        waitlisted: allocations.filter((a) => a.status === 'waitlisted').length,
        unallocated: allocations.filter((a) => a.status === 'unallocated').length,
        total_seats,
        filled_seats: filled,
        unfilled_seats: Math.max(total_seats - filled, 0),
      },
      // Convenience properties matching frontend dashboard Cards
      student_count: studentUserCount,
      organization_count: orgCount,
      internship_count: publishedInternCount,
      application_count: applications.length,
      round: latest ? { ...latest, id: latest._id || latest.id } : null,
      charts: {
        applications_by_domain: app_domains,
        internships_by_domain: domain_counts,
        student_branches: branches,
        eligibility: eligibility_chart,
        allocation: allocation_chart,
        match_score_distribution: buckets,
        seat_utilization: utilization,
      },
      data_source: 'live_database',
    });
  } catch (err) {
    return NextResponse.json(
      { detail: err.message || 'Unauthorized' },
      { status: err.status || 500 }
    );
  }
}
