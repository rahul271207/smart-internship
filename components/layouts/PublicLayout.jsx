'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function NavLink({ href, children, className = '' }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href} className={`${isActive ? 'text-navy-900 font-bold' : ''} ${className}`}>
      {children}
    </Link>
  );
}

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold text-navy-900">
            Smart Internship Allocation Engine
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
            <NavLink href="/about">About</NavLink>
            <NavLink href="/how-it-works">How it works</NavLink>
            <NavLink href="/contact">Support</NavLink>
            <NavLink href="/login" className="rounded-lg px-3 py-1.5 hover:bg-slate-100">Login</NavLink>
            <NavLink href="/register" className="rounded-lg bg-navy-800 px-3 py-1.5 text-white">
              Student register
            </NavLink>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 bg-navy-950 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
          <div>
            <p className="font-semibold text-white">SIAE</p>
            <p className="mt-2 text-sm">
              Independent SIH25033 prototype. This application is not an official Government of India product and is
              not integrated with the PM Internship Scheme unless separately verified.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Navigate</p>
            <div className="mt-2 flex flex-col gap-1">
              <Link href="/how-it-works">Allocation engine</Link>
              <Link href="/about">Problem statement</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Demo</p>
            <p className="mt-2">Local credentials are listed in the project README. Change them before any public deployment.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
