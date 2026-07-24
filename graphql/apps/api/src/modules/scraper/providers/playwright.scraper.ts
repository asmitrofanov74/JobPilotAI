import { Logger } from '@nestjs/common';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { NormalizedJob } from './normalized-job.interface';

const logger = new Logger('PlaywrightScraper');

export class PlaywrightScraper {
  static async run(source: string, url: string, query: string, location?: string): Promise<NormalizedJob[]> {
    const tmpDir = path.join(__dirname, '..', '..', '..', '..', 'tmp');
    try { fs.mkdirSync(tmpDir, { recursive: true }); } catch {}
    const outFile = path.join(tmpDir, `${source}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.json`);
    const scriptFile = path.join(tmpDir, `${source}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.cjs`);

    const script = `
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-CA,en;q=0.9' });
  try {
    await page.goto(${JSON.stringify(url)}, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    const jobs = await page.evaluate((src, q) => {
      const sel = '[data-testid="job-card"],.job_seen_beacon,.job-card,.jobCard,.result,.job_result,.job-card-container,.job-search-card,.base-card,.result-card,.jobListing,.react-job-listing,.jobContainer,[data-test*="job"],.job_card,.job-result,.job_result_item,article[data-job],[data-ved],.vNEEBe';
      return Array.from(document.querySelectorAll(sel)).slice(0,20).map(c => {
        const t = c.querySelector('h2 a,.jobTitle a,[data-testid*="title"] a,.job-title,.job-card-title,.base-search-card__title,h3 a,.jobTitle,a[data-test*="title"],.jobLink,.title a,h2 a,.job_title a,h3,[role="heading"]')?.textContent?.trim();
        const co = c.querySelector('[data-testid*="company"],.companyName,.company,[data-testid="company-name"],.company-name,.job-card-company,.base-search-card__subtitle,.employerName,[data-test*="company"],.company_name,.name,[data-company],.Q7PwXb')?.textContent?.trim();
        const l = c.querySelector('[data-testid*="location"],.location,.companyLocation,[data-testid="text-location"],.job-location,.job-card-location,.job-search-card__location,.loc,[data-location],.QkFJVe')?.textContent?.trim();
        const d = c.querySelector('[data-testid*="snippet"],.job-snippet,.description,.summary,.job_description,p')?.textContent?.trim();
        const link = c.querySelector('a[href*="/jobs/view"],a[href*="/job-listing"],a[href*="/job/"],a[href*="/rc/"]');
        const href = link?.getAttribute('href') || '';
        if (!t || !co) return null;
        const ju = href.startsWith('http') ? href : ('https://www.ca.indeed.com' + href);
        return { title: t, company: co, location: l||'', description: d||'', source: src, sourceUrl: ju };
      }).filter(Boolean);
    }, ${JSON.stringify(source)}, ${JSON.stringify(query)});
    fs.writeFileSync(${JSON.stringify(outFile)}, JSON.stringify({jobs}));
  } catch(e) {
    fs.writeFileSync(${JSON.stringify(outFile)}, JSON.stringify({jobs:[], error: e.message}));
  }
  await browser.close();
})();
`;

    try {
      fs.writeFileSync(scriptFile, script, 'utf-8');
      execSync(`node "${scriptFile}"`, { timeout: 30000, encoding: 'utf-8', cwd: path.join(__dirname, '..', '..', '..', '..') });
      if (fs.existsSync(outFile)) {
        const raw = fs.readFileSync(outFile, 'utf-8');
        const result = JSON.parse(raw);
        logger.log(`Got ${result.jobs?.length || 0} jobs from ${source}`);
        return (result.jobs || []).map((j: { title: string; company: string; location: string; description: string; source: string; sourceUrl: string }) => ({
          ...j,
          postedAt: undefined,
        }));
      }
    } catch (err) {
      logger.warn(`${source} error: ${err instanceof Error ? err.message : err}`);
    } finally {
      try { fs.unlinkSync(outFile); } catch {}
      try { fs.unlinkSync(scriptFile); } catch {}
    }
    return [];
  }
}
