import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedJob {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  jobUrl: string;
  location: string;
  salaryRange: string | null;
  source: string;
  sourceUrl: string;
  sourceId: string;
  employmentType: string | null;
  workMode: string | null;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  async scrapeIndeed(keywords: string, location: string, maxPages = 3): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    const baseUrl = 'https://ca.indeed.com';

    for (let page = 0; page < maxPages; page++) {
      try {
        const start = page * 10;
        const url = `${baseUrl}/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}&start=${start}`;
        this.logger.log(`Scraping Indeed page ${page + 1}: ${url}`);

        const { data } = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-CA,en;q=0.9',
          },
          timeout: 15000,
        });

        const $ = cheerio.load(data);
        const cards = $('[data-testid="job-card"]');

        if (cards.length === 0) break;

        cards.each((_, el) => {
          const $el = $(el);
          const titleEl = $el.find('h2 a');
          const companyEl = $el.find('[data-testid="company-name"]');
          const locationEl = $el.find('[data-testid="text-location"]');
          const salaryEl = $el.find('[data-testid="attribute-text-modal"]').first();
          const descEl = $el.find('[data-testid="job-snippet"]');
          const urlSuffix = titleEl.attr('href') || '';

          const jobTitle = titleEl.text().trim();
          const companyName = companyEl.text().trim();
          if (!jobTitle || !companyName) return;

          const job: ScrapedJob = {
            companyName,
            jobTitle,
            jobDescription: descEl.text().trim(),
            jobUrl: urlSuffix.startsWith('http') ? urlSuffix : `${baseUrl}${urlSuffix}`,
            location: locationEl.text().trim() || location,
            salaryRange: salaryEl.text().trim() || null,
            source: 'INDEED',
            sourceUrl: `${baseUrl}${urlSuffix}`,
            sourceId: `indeed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            employmentType: null,
            workMode: null,
          };
          jobs.push(job);
        });

        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        this.logger.warn(`Indeed page ${page + 1} failed: ${err instanceof Error ? err.message : err}`);
        break;
      }
    }

    this.logger.log(`Scraped ${jobs.length} jobs from Indeed`);
    return jobs;
  }

  async scrapeLinkedIn(keywords: string, location: string): Promise<ScrapedJob[]> {
    this.logger.log('LinkedIn scraping requires Puppeteer/Playwright. Returning demo data.');
    return this.generateDemoJobs(keywords, location, 'LINKEDIN');
  }

  async scrapeGlassdoor(keywords: string, location: string): Promise<ScrapedJob[]> {
    this.logger.log('Glassdoor scraping requires Puppeteer/Playwright. Returning demo data.');
    return this.generateDemoJobs(keywords, location, 'GLASSDOOR');
  }

  private generateDemoJobs(keywords: string, location: string, source: string): ScrapedJob[] {
    const companies: Array<{ name: string; desc: string; salary: string }> = [
      { name: 'TechCorp Inc.', desc: 'Leading technology company building next-gen solutions.', salary: '$120K - $160K' },
      { name: 'DataFlow Systems', desc: 'Data analytics platform serving enterprise clients.', salary: '$130K - $175K' },
      { name: 'CloudBase Technologies', desc: 'Cloud infrastructure and DevOps tools provider.', salary: '$140K - $180K' },
      { name: 'InnovateAI Labs', desc: 'AI research lab focused on NLP and computer vision.', salary: '$150K - $200K' },
      { name: 'SecureNet Solutions', desc: 'Cybersecurity company protecting digital assets.', salary: '$125K - $165K' },
    ];

    return companies.map((c) => ({
      companyName: c.name,
      jobTitle: keywords.includes('software') || keywords.includes('engineer')
        ? `Senior ${keywords}`
        : `${keywords} Specialist`,
      jobDescription: `${c.desc} We are looking for a talented professional to join our growing team in ${location}. You will work on cutting-edge projects and collaborate with industry experts.`,
      jobUrl: `https://${source.toLowerCase()}.com/jobs/${c.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      location,
      salaryRange: c.salary,
      source,
      sourceUrl: `https://${source.toLowerCase()}.com/jobs/view/${Date.now()}`,
      sourceId: `${source.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      employmentType: 'Full-time',
      workMode: 'Hybrid',
    }));
  }

  async scrapeAll(keywords: string, location: string): Promise<ScrapedJob[]> {
    const results = await Promise.allSettled([
      this.scrapeIndeed(keywords, location),
      this.scrapeLinkedIn(keywords, location),
      this.scrapeGlassdoor(keywords, location),
    ]);

    const jobs: ScrapedJob[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        jobs.push(...result.value);
      }
    }

    const seen = new Set<string>();
    return jobs.filter((job) => {
      const key = `${job.companyName}-${job.jobTitle}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
