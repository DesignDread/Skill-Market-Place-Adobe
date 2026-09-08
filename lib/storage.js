import fs from 'fs';
import path from 'path';

const dataDir = process.env.VERCEL
  ? path.join('/tmp', 'skill-market-place-adobe-data')
  : path.join(process.cwd(), 'data');
const reportsDir = path.join(dataDir, 'reports');
const schedulesFile = path.join(dataDir, 'schedules.json');

function ensureDirs() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  if (!fs.existsSync(schedulesFile)) fs.writeFileSync(schedulesFile, '[]');
}

export function saveReport(report) {
  ensureDirs();
  const site = report.site.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = Date.now();
  const filename = `${site}_${timestamp}.json`;
  fs.writeFileSync(path.join(reportsDir, filename), JSON.stringify(report, null, 2));
  return { id: filename, ...report };
}

export function listReports() {
  ensureDirs();
  const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const content = JSON.parse(fs.readFileSync(path.join(reportsDir, file), 'utf-8'));
    return {
      id: file,
      site: content.site,
      audited_at: content.audited_at,
      summary: content.summary,
    };
  }).sort((a, b) => new Date(b.audited_at).getTime() - new Date(a.audited_at).getTime());
}

export function getReport(id) {
  ensureDirs();
  const filepath = path.join(reportsDir, id);
  if (!fs.existsSync(filepath)) return null;
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

export function getSchedules() {
  ensureDirs();
  return JSON.parse(fs.readFileSync(schedulesFile, 'utf-8'));
}

export function saveSchedules(schedules) {
  ensureDirs();
  fs.writeFileSync(schedulesFile, JSON.stringify(schedules, null, 2));
}
