import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'SkillIQ | AI Discoverability Intelligence',
  description: 'Professional AI-discoverability audits for the modern web.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark bg-background">
      <body className="flex min-h-screen bg-background text-foreground font-sans">
        <aside className="hidden w-72 shrink-0 border-r border-border/70 bg-card/40 p-5 backdrop-blur-xl md:flex md:flex-col">
          <div className="flex items-center gap-3 border-b border-border/70 px-2 pb-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(88,214,210,.25)]">SI</div>
            <div><h1 className="text-lg font-semibold tracking-tight">SkillIQ</h1><p className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Intelligence layer</p></div>
          </div>
          <nav className="flex flex-1 flex-col gap-2 py-8" aria-label="Main navigation">
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Workspace</p>
            <Link href="/" className="rounded-xl bg-primary/10 px-3 py-3 text-sm font-medium text-primary transition hover:bg-primary/15">Run audit <span className="float-right text-xs">↗</span></Link>
            <Link href="/history" className="rounded-xl px-3 py-3 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">History</Link>
            <Link href="/schedule" className="rounded-xl px-3 py-3 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">Schedules</Link>
          </nav>
          <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">System status</p><div className="mt-3 flex items-center gap-2 text-sm"><span className="size-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />All systems operational</div></div>
        </aside>
        <main className="min-w-0 flex-1 overflow-auto"><div className="mx-auto max-w-7xl p-5 md:p-10">{children}</div></main>
      </body>
    </html>
  );
}
