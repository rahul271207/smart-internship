'use client';
import Link from 'next/link';
import { CheckCircle2, GitBranch, Scale, ShieldCheck, Users } from 'lucide-react';
import PublicLayout from '@/components/layouts/PublicLayout';

function PipelineArt() {
  return (
    <svg viewBox="0 0 560 320" className="h-auto w-full" role="img" aria-label="Allocation pipeline illustration">
      <rect width="560" height="320" rx="24" fill="#0b1f33" />
      <text x="28" y="40" fill="#d4b984" fontSize="12" fontFamily="Segoe UI">Eligibility → Matching → Allocation</text>
      {[
        [40, 90, 'Profiles'],
        [160, 90, 'Internships'],
        [280, 90, 'Eligibility'],
        [400, 90, 'Scores'],
      ].map(([x, y, label]) => (
        <g key={label}>
          <rect x={x} y={y} width="100" height="52" rx="10" fill="#123049" stroke="#c5a46e" />
          <text x={x + 50} y={y + 32} textAnchor="middle" fill="#fff" fontSize="12">{label}</text>
        </g>
      ))}
      <path d="M140 116 H160 M260 116 H280 M380 116 H400" stroke="#c5a46e" strokeWidth="2" />
      <rect x="120" y="190" width="320" height="80" rx="12" fill="#1a4464" />
      <text x="280" y="222" textAnchor="middle" fill="#fff" fontSize="14">Seat-aware deferred acceptance</text>
      <text x="280" y="246" textAnchor="middle" fill="#d4b984" fontSize="12">Allocated · Waitlisted · Unallocated</text>
    </svg>
  );
}

export default function Landing() {
  return (
    <PublicLayout>
      <div>
        <section className="bg-navy-950 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold-400">SIH25033 independent prototype</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">Smart Internship Allocation Engine</h1>
              <p className="mt-4 text-slate-300">
                Internship allocation is hard when many students compete for limited seats with different eligibility
                rules and ranked preferences. This platform checks eligibility, scores compatibility, then allocates
                seats transparently.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="rounded-lg bg-gold-500 px-5 py-2.5 font-semibold text-navy-950">
                  Student registration
                </Link>
                <Link href="/how-it-works" className="rounded-lg border border-slate-500 px-5 py-2.5 font-semibold">
                  How allocation works
                </Link>
                <Link href="/register/organization" className="rounded-lg border border-slate-500 px-5 py-2.5 font-semibold">
                  Organization access
                </Link>
              </div>
            </div>
            <PipelineArt />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-navy-900">The problem</h2>
          <p className="mt-3 max-w-3xl text-slate-600">
            Manual shortlisting mixes eligibility, personal preference, and limited capacity into one opaque decision.
            High match scores get confused with selection, waitlists are informal, and students cannot see why they
            were not allocated.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { title: 'Eligibility', text: 'Mandatory rules such as branch, CGPA, year, and deadline are checked first. AI is not used for eligibility.' },
              { title: 'Matching', text: 'A weighted compatibility score explains skills, academics, preferences, projects, location, and certifications.' },
              { title: 'Allocation', text: 'A seat-aware deferred-acceptance process assigns at most one internship per student without exceeding capacity.' },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-2xl font-bold text-navy-900">How it works</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-5">
              {[
                'Student profile creation',
                'Internship requirement configuration',
                'Mandatory eligibility verification',
                'Compatibility scoring and preferences',
                'Seat-aware allocation and publication',
              ].map((step, i) => (
                <li key={step} className="rounded-2xl border border-slate-200 p-4">
                  <span className="text-xs font-bold text-gold-500">0{i + 1}</span>
                  <p className="mt-2 text-sm font-medium">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-navy-900">Recommendations are not allocations</h2>
          <p className="mt-3 max-w-3xl text-slate-600">
            A 95/100 compatibility score is not a 95% chance of receiving the internship. Matching ranks fit.
            Allocation respects remaining seats, competing applicants, preference order, and the published policy.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Eligibility first' },
              { icon: Users, title: 'Preference-aware' },
              { icon: Scale, title: 'Capacity constrained' },
              { icon: GitBranch, title: 'Explainable results' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-xl bg-navy-900 p-4 text-white">
                <item.icon className="h-5 w-5 text-gold-400" />
                <span className="text-sm font-medium">{item.title}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              This is a college hackathon prototype for problem statement SIH25033. It does not claim official
              endorsement, live government integration, or production impact statistics.
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
