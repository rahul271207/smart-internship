'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, UserRound, Briefcase, FileText, GitCompare,
  Trophy, Settings, Building2, Shield, SlidersHorizontal,
  ScrollText, LogOut, Menu,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Notice } from '@/components/common/UI';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useRouter } from 'next/navigation';

const studentNav = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/profile', label: 'My profile', icon: UserRound },
  { to: '/student/internships', label: 'Discover internships', icon: Briefcase },
  { to: '/student/applications', label: 'Applications', icon: FileText },
  { to: '/student/preferences', label: 'Preferences', icon: GitCompare },
  { to: '/student/resume', label: 'Resume', icon: FileText },
  { to: '/student/matches', label: 'Match analysis', icon: GitCompare },
  { to: '/student/results', label: 'Allocation results', icon: Trophy },
  { to: '/student/history', label: 'History', icon: ScrollText },
  { to: '/student/settings', label: 'Settings', icon: Settings },
];

const orgNav = [
  { to: '/org', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/org/internships/new', label: 'Create internship', icon: Briefcase },
  { to: '/org/internships', label: 'Manage internships', icon: Building2 },
  { to: '/org/stats', label: 'Statistics', icon: GitCompare },
  { to: '/org/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/students', label: 'Students', icon: UserRound },
  { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/admin/internships', label: 'Internships', icon: Briefcase },
  { to: '/admin/applications', label: 'Applications', icon: FileText },
  { to: '/admin/eligibility', label: 'Eligibility', icon: Shield },
  { to: '/admin/matching', label: 'Matching analytics', icon: GitCompare },
  { to: '/admin/allocation', label: 'Allocation control', icon: Trophy },
  { to: '/admin/results', label: 'Results', icon: Trophy },
  { to: '/admin/waitlist', label: 'Waitlist', icon: ScrollText },
  { to: '/admin/simulation', label: 'What-if simulation', icon: SlidersHorizontal },
  { to: '/admin/audit', label: 'Audit logs', icon: ScrollText },
  { to: '/admin/config', label: 'Matching config', icon: Settings },
  { to: '/admin/settings', label: 'System settings', icon: Settings },
];

function NavItem({ to, label, icon: Icon, onClick }) {
  const pathname = usePathname();
  const parts = to.split('/').filter(Boolean);
  const isActive = parts.length <= 1
    ? pathname === to
    : pathname === to || pathname.startsWith(to + '/');

  return (
    <Link
      href={to}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-navy-800 text-white' : 'hover:bg-navy-900'}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export default function DashboardLayout({ role, children }) {
  const { user, logout, notice, flash } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = role === 'admin' ? adminNav : role === 'organization' ? orgNav : studentNav;

  return (
    <div className="min-h-screen bg-slate-100 md:grid md:grid-cols-[260px_1fr]">
      <aside className={`bg-navy-950 text-slate-200 ${open ? 'block' : 'hidden'} md:block`}>
        <div className="px-5 py-5">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400">SIH25033 prototype</p>
          <p className="mt-1 text-lg font-semibold text-white">SIAE</p>
        </div>
        <nav className="flex flex-col gap-0.5 px-3 pb-8">
          {nav.map((item) => (
            <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />
          ))}
        </nav>
      </aside>
      <div>
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <button type="button" className="rounded-lg p-2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-semibold text-slate-800">{user?.name || user?.user?.name || 'User'}</span> ({user?.role || user?.user?.role || role})
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            onClick={() => {
              logout();
              flash('success', 'Signed out.');
              router.push('/');
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </header>
        <div className="p-4 md:p-6">
          <Notice notice={notice} onClose={() => flash('info', '')} />
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
