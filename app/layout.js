import './globals.css';
import WorkspaceNav from '../components/WorkspaceNav';

const brandLogoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design%20%289%29-EoRL7JXaa0P6LeDgxK7MsWK5c379Po.png';

export const metadata = {
  title: 'SkillIQ | AI Discoverability Intelligence',
  description: 'Professional AI-discoverability audits for the modern web.',
  icons: {
    icon: brandLogoUrl,
    shortcut: brandLogoUrl,
    apple: brandLogoUrl,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark bg-background">
      <body className="flex min-h-screen bg-background text-foreground font-sans">
        <aside className="hidden w-72 shrink-0 border-r border-border/70 bg-card/40 p-5 backdrop-blur-xl md:flex md:flex-col">
          <div className="flex items-center gap-1 border-b border-border/70 px-2 pb-6">
            <img src={brandLogoUrl} alt="SkillIQ" width="180" height="72" className="h-auto w-40 object-contain" />
            <div><h1 className="text-lg font-semibold tracking-tight">SkillIQ</h1><p className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Intelligence layer</p></div>
          </div>
          <WorkspaceNav />
          <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">System status</p><div className="mt-3 flex items-center gap-2 text-sm"><span className="size-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />All systems operational</div></div>
        </aside>
        <main className="min-w-0 flex-1 overflow-auto"><div className="mx-auto max-w-7xl p-5 md:p-10">{children}</div></main>
      </body>
    </html>
  );
}
