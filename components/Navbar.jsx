'use client';

import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-card/60 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-end px-5 md:px-10">
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
