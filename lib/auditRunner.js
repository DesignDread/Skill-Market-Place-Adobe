export const executeAudit = async (url, maxPages) => {
  const { runAudit } = await import('orchestrator');
  return runAudit({
    url,
    maxPages: maxPages || 15,
    apiKey: process.env.GEMINI_API_KEY || undefined,
  });
};
