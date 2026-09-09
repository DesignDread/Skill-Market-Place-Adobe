'use client';

import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-card/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 md:px-10">
        {/* Logo + Brand — horizontally placed */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png?v=3"
            alt="SkillIQ"
            width={32}
            height={32}
            className="h-7 w-7 object-contain"
            priority
            unoptimized
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">SkillIQ</span>
            <span className="font-mono text-[8px] uppercase tracking-[.18em] text-muted-foreground">
              Intelligence layer
            </span>
          </div>
        </Link>

        {/* Right: status + theme */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
            <span>Operational</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
