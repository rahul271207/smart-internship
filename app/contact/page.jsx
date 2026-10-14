'use client';
import PublicLayout from '@/components/layouts/PublicLayout';

export default function Contact() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold text-navy-900">Contact and support</h1>
        <p className="mt-4 text-slate-600">
          This prototype is intended for local demonstration. For team support, use your college hackathon channel.
          Demo accounts are documented in the README and must not be used in a public deployment.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <p>Project: SIH25033 Smart Internship Allocation Engine</p>
          <p className="mt-2">API docs (local): http://localhost:3000/api/health</p>
        </div>
      </div>
    </PublicLayout>
  );
}
