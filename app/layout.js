import './globals.css';
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
        {/* Horizontal navbar with logo */}
        <Navbar />

        {/* Below the navbar: sidebar (no logo) + main content */}
        <div className="flex flex-1">
          <aside className="hidden w-56 shrink-0 border-r border-border/70 bg-card/40 p-5 backdrop-blur-xl md:flex md:flex-col">
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
