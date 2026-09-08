import * as cheerio from 'cheerio';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

// Minimal required-field shapes per common schema.org type — not exhaustive,
// just enough to catch "present but missing the fields assistants read first."
const MIN_SCHEMAS = {
  Product: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1 },
      offers: { type: 'object' },
    },
  },
  Organization: {
    type: 'object',
    required: ['name'],
    properties: { name: { type: 'string', minLength: 1 } },
  },
  Article: {
    type: 'object',
    required: ['headline'],
    properties: { headline: { type: 'string', minLength: 1 } },
  },
  FAQPage: {
    type: 'object',
    required: ['mainEntity'],
  },
};

function extractJsonLdBlocks(html) {
  const $ = cheerio.load(html);
  const blocks = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) blocks.push(item);
    } catch {
      blocks.push({ __parseError: true, raw: raw.slice(0, 200) });
    }
  });
  return blocks;
}

/**
 * Checks structured data across a set of {url, html} pages. Infers the
 * "expected" type per page loosely (e.g. a page under /product/ should
 * probably have Product markup) — this is intentionally conservative to
 * avoid false positives on pages where no particular type is expected.
 *
 * @param {{url: string, html: string, expectedType?: string}[]} pages
 */
export function checkStructuredData(pages) {
  const findings = [];
  let pagesWithAny = 0;
  let pagesWithParseErrors = 0;
  const missingByType = {};

  for (const page of pages) {
    const blocks = extractJsonLdBlocks(page.html);
    if (blocks.length > 0) pagesWithAny += 1;

    const parseErrors = blocks.filter((b) => b.__parseError);
    if (parseErrors.length > 0) pagesWithParseErrors += 1;

    if (page.expectedType) {
      const validBlock = blocks.find((b) => {
        const types = Array.isArray(b['@type']) ? b['@type'] : [b['@type']];
        return types.includes(page.expectedType);
      });
      const schema = MIN_SCHEMAS[page.expectedType];
      if (!validBlock) {
        missingByType[page.expectedType] = (missingByType[page.expectedType] || 0) + 1;
      } else if (schema) {
        const validate = ajv.compile(schema);
        if (!validate(validBlock)) {
          findings.push({
            title: `Invalid or incomplete ${page.expectedType} structured data`,
            category: 'off-site-discoverability',
            severity: 'medium',
            evidence: `${page.url}: ${page.expectedType} JSON-LD present but fails validation: ${ajv.errorsText(validate.errors)}.`,
            suggested_action: {
              summary: `Fix required fields on the ${page.expectedType} JSON-LD block.`,
              detail: `Missing/invalid fields: ${ajv.errorsText(validate.errors)}. AI assistants and search engines skip structured data blocks that fail basic shape validation.`,
              priority: 'medium',
            },
            sourceCheck: 'structured-data',
          });
        }
      }
    }
  }

  for (const [type, count] of Object.entries(missingByType)) {
    const total = pages.filter((p) => p.expectedType === type).length;
    findings.push({
      title: `No ${type} structured data on pages that appear to need it`,
      category: 'off-site-discoverability',
      severity: 'high',
      evidence: `Sampled ${total} page(s) that appear to be ${type} pages; ${count}/${total} contain no ${type} JSON-LD markup.`,
      suggested_action: {
        summary: `Add ${type} JSON-LD to every relevant page.`,
        detail: `Include the core fields AI shopping/answer surfaces read first (e.g. name, description, and for Product: price/availability/sku via an Offer).`,
        priority: 'high',
      },
      sourceCheck: 'structured-data',
    });
  }

  if (pagesWithParseErrors > 0) {
    findings.push({
      title: 'Malformed JSON-LD blocks found',
      category: 'off-site-discoverability',
      severity: 'medium',
      evidence: `${pagesWithParseErrors} page(s) contain a <script type="application/ld+json"> block that fails to parse as valid JSON.`,
      suggested_action: {
        summary: 'Fix JSON syntax errors in structured data blocks.',
        detail: 'A malformed JSON-LD block is silently ignored by parsers, which is equivalent to having no structured data at all on that page.',
        priority: 'medium',
      },
      sourceCheck: 'structured-data',
    });
  }

  return {
    findings,
    coverage: { pagesChecked: pages.length, pagesWithAny, pagesWithParseErrors },
  };
}
