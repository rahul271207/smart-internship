'use client';
import PublicLayout from '@/components/layouts/PublicLayout';

export default function About() {
  return (
    <PublicLayout>
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
    </PublicLayout>
  );
}
