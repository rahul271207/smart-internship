'use client';
import PublicLayout from '@/components/layouts/PublicLayout';

export default function HowItWorks() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold text-navy-900">How the allocation engine works</h1>
        <ol className="mt-6 space-y-4 text-slate-600">
          <li><strong className="text-slate-800">1. Eligibility.</strong> Branch, CGPA, academic year, deadline, availability, publication status, and optional mandatory skills are evaluated as pass/fail rules.</li>
          <li><strong className="text-slate-800">2. Matching.</strong> Factor scores (skills 30%, academics 20%, preference 20%, projects 10%, location 10%, certifications 10%) are weighted. Administrators can change weights if they still sum to 100%.</li>
          <li><strong className="text-slate-800">3. Preference order.</strong> Each student proposes internships in ranked order. Missing preferences are scored as a configurable fallback, never as a perfect match.</li>
          <li><strong className="text-slate-800">4. Deferred acceptance.</strong> Internships keep the highest-priority applicants up to seat capacity. Dropped applicants continue to their next choice. Tie-break: earlier application time, then student id.</li>
          <li><strong className="text-slate-800">5. Waitlist and reallocation.</strong> Eligible students who miss a seat can be waitlisted. Rejecting an offer releases the seat to the next valid waitlisted candidate.</li>
        </ol>
      </div>
    </PublicLayout>
  );
}
