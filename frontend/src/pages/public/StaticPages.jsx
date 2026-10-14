export function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-navy-900">About this platform</h1>
      <p className="mt-4 text-slate-600">
        Smart Internship Allocation Engine is an independent prototype built for Smart India Hackathon problem
        SIH25033. It demonstrates a complete allocation workflow: student profiles, internship publishing,
        eligibility, AI-assisted matching with a keyword fallback, seat-aware allocation, waitlists, and
        explanations.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Objectives</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
        <li>Prevent ineligible applications from receiving seats.</li>
        <li>Score compatibility without presenting scores as selection probabilities.</li>
        <li>Allocate limited seats using a deterministic preference-aware algorithm.</li>
        <li>Publish explanations that a first-year engineering team can audit and extend.</li>
      </ul>
    </div>
  );
}

export function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-navy-900">How the allocation engine works</h1>
      <ol className="mt-6 space-y-4 text-slate-600">
        <li>
          <strong className="text-slate-800">1. Eligibility.</strong> Branch, CGPA, academic year, deadline,
          availability, publication status, and optional mandatory skills are evaluated as pass/fail rules.
        </li>
        <li>
          <strong className="text-slate-800">2. Matching.</strong> Factor scores (skills 30%, academics 20%,
          preference 20%, projects 10%, location 10%, certifications 10%) are weighted. Administrators can change
          weights if they still sum to 100%.
        </li>
        <li>
          <strong className="text-slate-800">3. Preference order.</strong> Each student proposes internships in
          ranked order. Missing preferences are scored as a configurable fallback, never as a perfect match.
        </li>
        <li>
          <strong className="text-slate-800">4. Deferred acceptance.</strong> Internships keep the highest-priority
          applicants up to seat capacity. Dropped applicants continue to their next choice. Tie-break: earlier
          application time, then student id.
        </li>
        <li>
          <strong className="text-slate-800">5. Waitlist and reallocation.</strong> Eligible students who miss a seat
          can be waitlisted. Rejecting an offer releases the seat to the next valid waitlisted candidate.
        </li>
      </ol>
    </div>
  );
}

export function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-navy-900">Contact and support</h1>
      <p className="mt-4 text-slate-600">
        This prototype is intended for local demonstration. For team support, use your college hackathon channel.
        Demo accounts are documented in the README and must not be used in a public deployment.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <p>Project: SIH25033 Smart Internship Allocation Engine</p>
        <p className="mt-2">API docs (local): http://127.0.0.1:8000/docs</p>
      </div>
    </div>
  );
}
