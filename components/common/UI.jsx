'use client';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export function Badge({ status, children }) {
  const map = {
    allocated: 'bg-emerald-100 text-emerald-800',
    waitlisted: 'bg-amber-100 text-amber-800',
    unallocated: 'bg-slate-200 text-slate-700',
    ineligible: 'bg-rose-100 text-rose-800',
    pending: 'bg-sky-100 text-sky-800',
    published: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-indigo-100 text-indigo-800',
    submitted: 'bg-sky-100 text-sky-800',
    eligible: 'bg-emerald-100 text-emerald-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-800',
    draft: 'bg-slate-200 text-slate-700',
    closed: 'bg-slate-300 text-slate-700',
    hybrid: 'bg-indigo-100 text-indigo-800',
    remote: 'bg-cyan-100 text-cyan-800',
    onsite: 'bg-orange-100 text-orange-900',
  };
  const key = String(status || children || '').toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[key] || 'bg-slate-100 text-slate-700'}`}>
      {children || status}
    </span>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          {title ? <h2 className="text-base font-semibold text-navy-900">{title}</h2> : <span />}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function Skeleton({ rows = 4 }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-200" />
      ))}
    </div>
  );
}

export function Notice({ notice, onClose }) {
  if (!notice) return null;
  const Icon = notice.type === 'error' ? AlertCircle : notice.type === 'success' ? CheckCircle2 : Info;
  const color =
    notice.type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : notice.type === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : 'border-sky-200 bg-sky-50 text-sky-800';
  return (
    <div className={`mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 ${color}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm">{notice.message}</p>
      <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/60" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Table({ columns, rows, empty = 'No records.' }) {
  if (!rows?.length) return <EmptyState title={empty} text="Try adjusting filters or wait for new data." />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-3 py-2 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || idx} className="border-b border-slate-100 hover:bg-slate-50">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 align-top">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-navy-800 text-white hover:bg-navy-700',
    secondary: 'bg-white text-navy-800 border border-slate-300 hover:bg-slate-50',
    gold: 'bg-gold-500 text-navy-950 hover:bg-gold-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function inputClass() {
  return 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-700';
}
