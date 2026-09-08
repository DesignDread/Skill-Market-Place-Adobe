import cron from 'node-cron';
import { getSchedules, saveSchedules, saveReport } from './storage.js';
import path from 'node:path';
import { spawn } from 'node:child_process';

// The scheduler can run from a bundled server file, so resolve from the app
// working directory rather than from .next/server paths.
const root = process.cwd();
const cliPath = path.join(root, 'run-audit.js');

const activeJobs = new Map();

function runAuditProcess(url, maxPages) {
  const apiKey = process.env.GEMINI_API_KEY;
  const args = [cliPath, url, '--maxPages', String(maxPages || 15)];
  if (apiKey) args.push('--apiKey', apiKey);

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Audit failed (exit ${code}): ${stderr.slice(-500)}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`Could not parse audit output: ${e.message}`));
      }
    });
    child.on('error', reject);
  });
}

export function initScheduler() {
  const schedules = getSchedules();
  schedules.forEach(schedule => {
    startCronJob(schedule);
  });
}

function startCronJob(schedule) {
  if (activeJobs.has(schedule.id)) {
    activeJobs.get(schedule.id).stop();
  }
  
  const job = cron.schedule(schedule.cron, async () => {
    console.log(`Running scheduled audit for ${schedule.url}`);
    try {
      const report = await runAuditProcess(schedule.url, schedule.maxPages);
      saveReport(report);
      console.log(`Finished scheduled audit for ${schedule.url}`);
    } catch (err) {
      console.error(`Error in scheduled audit for ${schedule.url}:`, err);
    }
  });
  
  activeJobs.set(schedule.id, job);
}

export function addSchedule({ url, cronExp, maxPages }) {
  const schedules = getSchedules();
  const newSchedule = {
    id: Date.now().toString(),
    url,
    cron: cronExp,
    maxPages: maxPages || 15,
    created_at: new Date().toISOString()
  };
  schedules.push(newSchedule);
  saveSchedules(schedules);
  startCronJob(newSchedule);
  return newSchedule;
}

export function removeSchedule(id) {
  const schedules = getSchedules();
  const updated = schedules.filter(s => s.id !== id);
  saveSchedules(updated);
  if (activeJobs.has(id)) {
    activeJobs.get(id).stop();
    activeJobs.delete(id);
  }
  return true;
}
