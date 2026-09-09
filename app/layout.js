import './globals.css';
import Image from 'next/image';
import WorkspaceNav from '../components/WorkspaceNav';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'SkillIQ | AI Discoverability Intelligence',
  description: 'Professional AI-discoverability audits for the modern web.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-background text-foreground font-sans">
        {/* Horizontal navbar — no logo, just status + theme toggle */}
        <Navbar />

        {/* Below the navbar: sidebar + main content */}
        <div className="flex flex-1">
          <aside className="hidden w-56 shrink-0 border-r border-border/70 bg-card/40 px-4 py-5 backdrop-blur-xl md:flex md:flex-col">
            {/* Logo + brand — centered with sidebar content */}
            <div className="flex flex-col items-center gap-1.5 border-b border-border/70 pb-5">
              <Image src="/logo.png?v=3" alt="SkillIQ" width={40} height={40} className="h-9 w-9 object-contain" priority unoptimized />
              <h1 className="text-sm font-semibold tracking-tight">SkillIQ</h1>
              <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Intelligence layer</p>
            </div>
            <WorkspaceNav />
            <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">System status</p>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="size-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
                All systems operational
              </div>
            </div>
          </aside>
          <main className="min-w-0 flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl p-5 md:p-10">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
