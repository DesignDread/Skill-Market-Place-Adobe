/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'orchestrator',
    'reach-and-read',
    'trust-and-identity',
    'engagement-audit',
    'undici',
    'playwright',
    'cheerio',
    'robots-parser',
    'ajv',
    '@google/generative-ai',
    'node-cron',
  ],
  // Empty turbopack config silences the "no turbopack config" warning
  turbopack: {},
};

export default nextConfig;
