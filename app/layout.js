import './globals.css';
import { Manrope, IBM_Plex_Mono } from 'next/font/google';
import WorkspaceNav from '../components/WorkspaceNav';
import Navbar from '../components/Navbar';
import ThemeProvider from '../components/ThemeProvider';
import Footer from '../components/Footer';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-plex-mono', weight: ['400', '500', '600'], display: 'swap' });

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
    <html lang="en" className={`dark bg-background ${manrope.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-background text-foreground font-sans">
        <ThemeProvider>
          {/* Horizontal navbar with logo */}
          <Navbar />

          {/* Below the navbar: sidebar (no logo) + main content */}
          <div className="flex flex-1 overflow-hidden">
            <aside className="hidden w-56 shrink-0 border-r border-border/70 bg-card/40 p-5 backdrop-blur-xl md:flex md:flex-col overflow-y-auto">
              <WorkspaceNav />
              <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 mt-auto">
                <p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">System status</p>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="status-pulse size-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
                  All systems operational
                </div>
              </div>
            </aside>
            <main className="min-w-0 flex-1 flex flex-col overflow-y-auto">
              <div className="mx-auto w-full max-w-7xl flex-1 p-5 md:p-10">{children}</div>
              <Footer />
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
