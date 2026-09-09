'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const links = [
  { href: '/', label: 'Run Audit' },
  { href: '/history', label: 'History' },
  { href: '/schedule', label: 'Schedules' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-card/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-10">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png?v=3"
            alt="SkillIQ"
            width={36}
            height={36}
            className="h-8 w-8 object-contain"
            priority
            unoptimized
          />
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold tracking-tight">SkillIQ</span>
            <span className="hidden font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground sm:inline">
              Intelligence layer
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {links.map(({ href, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'rounded-lg bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary transition hover:bg-primary/15'
                    : 'rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground'
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right section: status + theme toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
            <span>Operational</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
