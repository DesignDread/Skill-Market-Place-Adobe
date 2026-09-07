import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'SkillIQ Dashboard',
  description: 'Intelligence for the AI-first web — AI-discoverability audit tool',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen bg-slate-900 text-slate-50 font-sans overflow-hidden">
        <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-2xl font-bold tracking-tight text-blue-400">SkillIQ</h1>
            <p className="text-xs text-slate-400 mt-1">Audit Dashboard</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/" className="block px-4 py-2 rounded hover:bg-slate-700 transition">Run Audit</Link>
            <Link href="/history" className="block px-4 py-2 rounded hover:bg-slate-700 transition">History</Link>
            <Link href="/schedule" className="block px-4 py-2 rounded hover:bg-slate-700 transition">Schedule</Link>
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
