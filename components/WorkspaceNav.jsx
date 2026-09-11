'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Run audit', external: true },
  { href: '/history', label: 'History' },
  { href: '/schedule', label: 'Schedules' },
];

export default function WorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-2 py-8" aria-label="Main navigation">
      <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Workspace</p>
      {links.map(({ href, label, external }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={isActive
              ? 'rounded-xl border border-primary/15 bg-primary/10 px-3 py-3 text-sm font-medium text-primary shadow-[inset_3px_0_0_var(--primary)] transition duration-300 hover:bg-primary/15'
              : 'rounded-xl px-3 py-3 text-sm text-muted-foreground transition duration-300 hover:translate-x-0.5 hover:bg-secondary hover:text-foreground'}
          >
            {label} {external && <span className="float-right text-xs">↗</span>}
          </Link>
        );
      })}
    </nav>
  );
}
