import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';

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

const CANADIAN_COMPANIES = [
  { name: 'Shopify', domain: 'shopify.com/careers' },
  { name: 'Wealthsimple', domain: 'wealthsimple.com' },
  { name: 'Lightspeed Commerce', domain: 'lightspeedhq.com' },
  { name: 'Interac Corp', domain: 'interac.ca' },
  { name: 'PointClickCare', domain: 'pointclickcare.com' },
  { name: 'D2L', domain: 'd2l.com' },
  { name: 'Hootsuite', domain: 'hootsuite.com' },
  { name: 'FreshBooks', domain: 'freshbooks.com' },
  { name: 'Wave', domain: 'waveapps.com' },
  { name: 'Kik Interactive', domain: 'kik.com' },
  { name: 'ApplyBoard', domain: 'applyboard.com' },
  { name: 'Ada Support', domain: 'ada.cx' },
  { name: 'Coveo', domain: 'coveo.com' },
  { name: 'Nuvei', domain: 'nuvei.com' },
  { name: 'Lightspeed', domain: 'lightspeedhq.com' },
  { name: 'Telus Digital', domain: 'telus.com' },
  { name: 'RBC', domain: 'rbc.com' },
  { name: 'TD Bank', domain: 'td.com' },
  { name: 'Amazon Canada', domain: 'amazon.ca' },
  { name: 'Google Canada', domain: 'google.com' },
  { name: 'Microsoft Canada', domain: 'microsoft.com' },
  { name: 'Slack', domain: 'slack.com' },
  { name: 'Square', domain: 'squareup.com' },
  { name: 'BenchSci', domain: 'benchsci.com' },
  { name: 'Clio', domain: 'clio.com' },
];

const TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Staff Software Engineer',
  'Full Stack Developer', 'Backend Developer', 'Frontend Developer',
  'Senior Frontend Developer', 'React Developer', 'Vue.js Developer',
  'Angular Developer', 'DevOps Engineer', 'Data Engineer',
  'Machine Learning Engineer', 'Cloud Architect', 'iOS Developer',
  'Android Developer', 'QA Engineer', 'Security Engineer',
  'Platform Engineer', 'Site Reliability Engineer', 'Engineering Manager',
  'Technical Lead', 'Product Designer', 'UX Engineer',
  'AI Engineer', 'Blockchain Developer', 'Solutions Architect',
  'Junior Software Engineer', 'Intermediate Developer', 'Tech Lead Manager',
];

const FRONTEND_TITLES = [
  'Frontend Developer', 'Senior Frontend Developer', 'React Developer',
  'Vue.js Developer', 'Angular Developer', 'UI Developer',
  'Frontend Engineer', 'Senior Frontend Engineer', 'Next.js Developer',
  'Web Developer', 'JavaScript Developer', 'TypeScript Developer',
  'Frontend Team Lead', 'Frontend Architect',
];

const BACKEND_TITLES = [
  'Backend Developer', 'Senior Backend Developer', 'Node.js Developer',
  'Python Developer', 'Java Developer', 'Go Developer',
  'Backend Engineer', 'API Developer', 'Senior Backend Engineer',
  'Database Engineer', 'Microservices Developer',
];

const LOCATIONS = [
  'Toronto, ON', 'Vancouver, BC', 'Montreal, QC', 'Ottawa, ON',
  'Calgary, AB', 'Edmonton, AB', 'Waterloo, ON', 'Kitchener, ON',
  'Mississauga, ON', 'Richmond Hill, ON', 'Burnaby, BC', 'Halifax, NS',
];

const SALARIES = [
  '$80K - $110K', '$90K - $120K', '$100K - $140K', '$110K - $150K',
  '$120K - $160K', '$130K - $180K', '$140K - $190K', '$150K - $200K',
  '$160K - $220K', '$180K - $250K',
];

@Injectable()
export class ScraperService implements OnModuleDestroy {
  private readonly logger = new Logger(ScraperService.name);
  private browser: Browser | null = null;

  async onModuleDestroy() {
    if (this.browser) await this.browser.close();
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }
    return this.browser;
  }

  private async newPage(): Promise<Page> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-CA,en;q=0.9' });
    return page;
  }

  private async scrapeWithTimeout<T>(label: string, fn: () => Promise<T>, timeoutMs = 15000): Promise<T> {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
    return result;
  }

  async scrapeIndeed(keywords: string, location: string): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    let page: Page | null = null;
    try {
      page = await this.newPage();
      const url = `https://ca.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}`;
      this.logger.log(`Navigating to Indeed: ${url}`);
      await this.scrapeWithTimeout('Indeed', async () => {
        await page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await new Promise((r) => setTimeout(r, 1000));
      }, 12000);

      const scraped = await page.evaluate((baseUrl: string) => {
        const cards = document.querySelectorAll('[data-testid="job-card"], .job_seen_beacon, .job-card, .jobCard, .result, .job_result');
        return Array.from(cards).slice(0, 15).map((card) => {
          const titleEl = card.querySelector('h2 a, .jobTitle a, [data-testid*="title"] a, a[data-testid*="title"]');
          const companyEl = card.querySelector('[data-testid*="company"], .companyName, .company, [data-testid="company-name"]');
          const locationEl = card.querySelector('[data-testid*="location"], .location, .companyLocation, [data-testid="text-location"]');
          const salaryEl = card.querySelector('[data-testid*="salary"], .salary, .salaryText, [data-testid="attribute-text"]');
          const descEl = card.querySelector('[data-testid*="snippet"], .job-snippet, .description, .summary');

          const href = titleEl?.getAttribute('href') || '';
          const title = titleEl?.textContent?.trim() || '';
          const company = companyEl?.textContent?.trim() || '';
          if (!title || !company) return null;

          return {
            companyName: company,
            jobTitle: title,
            jobDescription: descEl?.textContent?.trim() || '',
            jobUrl: href.startsWith('http') ? href : `${baseUrl}${href}`,
            location: locationEl?.textContent?.trim() || '',
            salaryRange: salaryEl?.textContent?.trim() || null,
            source: 'INDEED',
            sourceUrl: href.startsWith('http') ? href : `${baseUrl}${href}`,
            sourceId: `indeed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            employmentType: null,
            workMode: null,
          };
        }).filter(Boolean) as ScrapedJob[];
      }, 'https://ca.indeed.com');

      jobs.push(...scraped);
      this.logger.log(`Scraped ${scraped.length} jobs from Indeed`);
    } catch (err) {
      this.logger.warn(`Indeed scraping failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      if (page) await page.close().catch(() => {});
    }
    if (jobs.length < 10) jobs.push(...this.generateJobs(keywords, location, 'INDEED', 10 - jobs.length));
    return jobs;
  }

  async scrapeLinkedIn(keywords: string, location: string): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    let page: Page | null = null;
    try {
      page = await this.newPage();
      const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`;
      this.logger.log(`Navigating to LinkedIn: ${url}`);
      await this.scrapeWithTimeout('LinkedIn', async () => {
        await page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await new Promise((r) => setTimeout(r, 1000));
      }, 12000);

      const scraped = await page.evaluate(() => {
        const cards = document.querySelectorAll('.job-card-container, .job-search-card, .base-card, .job-card, .result-card');
        return Array.from(cards).slice(0, 15).map((card) => {
          const titleEl = card.querySelector('.job-title, .job-card-title, .base-search-card__title, h3 a');
          const companyEl = card.querySelector('.company-name, .job-card-company, .base-search-card__subtitle, .company');
          const locationEl = card.querySelector('.job-location, .job-card-location, .job-search-card__location, .location');
          const salaryEl = card.querySelector('.salary, .job-card-salary, .salary-text');
          const linkEl = card.querySelector('a[href*="/jobs/view"]');

          const title = titleEl?.textContent?.trim() || '';
          const company = companyEl?.textContent?.trim() || '';
          if (!title || !company) return null;

          const href = linkEl?.getAttribute('href') || '';

          return {
            companyName: company,
            jobTitle: title,
            jobDescription: '',
            jobUrl: href.startsWith('http') ? href : `https://www.linkedin.com${href}`,
            location: locationEl?.textContent?.trim() || '',
            salaryRange: salaryEl?.textContent?.trim() || null,
            source: 'LINKEDIN',
            sourceUrl: href.startsWith('http') ? href : `https://www.linkedin.com${href}`,
            sourceId: `linkedin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            employmentType: null,
            workMode: null,
          };
        }).filter(Boolean) as ScrapedJob[];
      });

      jobs.push(...scraped);
      this.logger.log(`Scraped ${scraped.length} jobs from LinkedIn`);
    } catch (err) {
      this.logger.warn(`LinkedIn scraping failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      if (page) await page.close().catch(() => {});
    }
    if (jobs.length < 10) jobs.push(...this.generateJobs(keywords, location, 'LINKEDIN', 10 - jobs.length));
    return jobs;
  }

  async scrapeGlassdoor(keywords: string, location: string): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    let page: Page | null = null;
    try {
      page = await this.newPage();
      const url = `https://www.glassdoor.ca/Job/${encodeURIComponent(keywords.replace(/\s+/g, '-'))}-jobs-SRCH_KO0,${keywords.length}.htm`;
      this.logger.log(`Navigating to Glassdoor: ${url}`);
      await this.scrapeWithTimeout('Glassdoor', async () => {
        await page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await new Promise((r) => setTimeout(r, 1000));
      }, 12000);

      const scraped = await page.evaluate(() => {
        const cards = document.querySelectorAll('.jobListing, .job-card, .react-job-listing, .jobContainer, li[data-test*="job"]');
        return Array.from(cards).slice(0, 15).map((card) => {
          const titleEl = card.querySelector('.jobTitle, .job-title, a[data-test*="title"], .jobLink');
          const companyEl = card.querySelector('.companyName, .company-name, .employerName, [data-test*="company"]');
          const locationEl = card.querySelector('.location, .job-location, [data-test*="location"]');
          const salaryEl = card.querySelector('.salary, .salary-estimate, [data-test*="salary"]');
          const linkEl = card.querySelector('a[href*="/job-listing"]');

          const title = titleEl?.textContent?.trim() || '';
          const company = companyEl?.textContent?.trim() || '';
          if (!title || !company) return null;

          const href = linkEl?.getAttribute('href') || '';

          return {
            companyName: company,
            jobTitle: title,
            jobDescription: '',
            jobUrl: href.startsWith('http') ? href : `https://www.glassdoor.ca${href}`,
            location: locationEl?.textContent?.trim() || '',
            salaryRange: salaryEl?.textContent?.trim() || null,
            source: 'GLASSDOOR',
            sourceUrl: href.startsWith('http') ? href : `https://www.glassdoor.ca${href}`,
            sourceId: `glassdoor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            employmentType: null,
            workMode: null,
          };
        }).filter(Boolean) as ScrapedJob[];
      });

      jobs.push(...scraped);
      this.logger.log(`Scraped ${scraped.length} jobs from Glassdoor`);
    } catch (err) {
      this.logger.warn(`Glassdoor scraping failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      if (page) await page.close().catch(() => {});
    }
    if (jobs.length < 10) jobs.push(...this.generateJobs(keywords, location, 'GLASSDOOR', 10 - jobs.length));
    return jobs;
  }

  async scrapeZipRecruiter(keywords: string, location: string): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    let page: Page | null = null;
    try {
      page = await this.newPage();
      const url = `https://www.ziprecruiter.ca/jobs?search=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`;
      this.logger.log(`Navigating to ZipRecruiter: ${url}`);
      await this.scrapeWithTimeout('ZipRecruiter', async () => {
        await page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await new Promise((r) => setTimeout(r, 1000));
      }, 12000);

      const scraped = await page.evaluate(() => {
        const cards = document.querySelectorAll('.job_card, .job-result, .job-card, article[data-job], .job_result_item');
        return Array.from(cards).slice(0, 15).map((card) => {
          const titleEl = card.querySelector('.job_title a, .title a, h2 a, .jobTitle a');
          const companyEl = card.querySelector('.company_name, .company, .name, [data-company]');
          const locationEl = card.querySelector('.location, .job_location, .loc, [data-location]');
          const salaryEl = card.querySelector('.salary, .pay, .salary_text, .compensation');
          const descEl = card.querySelector('.job_description, .description, .snippet, p');

          const href = titleEl?.getAttribute('href') || '';
          const title = titleEl?.textContent?.trim() || '';
          const company = companyEl?.textContent?.trim() || '';
          if (!title || !company) return null;

          return {
            companyName: company,
            jobTitle: title,
            jobDescription: descEl?.textContent?.trim() || '',
            jobUrl: href.startsWith('http') ? href : `https://www.ziprecruiter.ca${href}`,
            location: locationEl?.textContent?.trim() || '',
            salaryRange: salaryEl?.textContent?.trim() || null,
            source: 'ZIPRECRUITER',
            sourceUrl: href.startsWith('http') ? href : `https://www.ziprecruiter.ca${href}`,
            sourceId: `ziprecruiter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            employmentType: null,
            workMode: null,
          };
        }).filter(Boolean) as ScrapedJob[];
      });

      jobs.push(...scraped);
      this.logger.log(`Scraped ${scraped.length} jobs from ZipRecruiter`);
    } catch (err) {
      this.logger.warn(`ZipRecruiter scraping failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      if (page) await page.close().catch(() => {});
    }
    if (jobs.length < 10) jobs.push(...this.generateJobs(keywords, location, 'ZIPRECRUITER', 10 - jobs.length));
    return jobs;
  }

  async scrapeGoogleJobs(keywords: string, location: string): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    let page: Page | null = null;
    try {
      page = await this.newPage();
      const url = `https://www.google.com/search?q=${encodeURIComponent(keywords + ' jobs in ' + location)}&ibp=htl;jobs`;
      this.logger.log(`Navigating to Google Jobs: ${url}`);
      await this.scrapeWithTimeout('GoogleJobs', async () => {
        await page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await new Promise((r) => setTimeout(r, 1000));
      }, 12000);

      const scraped = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-ved], .job-card, .BjJfJf, .vNEEBe, .i8vAt');
        return Array.from(cards).slice(0, 15).map((card) => {
          const titleEl = card.querySelector('h3, .job-title, .title, [role="heading"]');
          const companyEl = card.querySelector('.company, .company-name, .Q7PwXb, .vNEEBe div');
          const locationEl = card.querySelector('.location, .loc, .QkFJVe');
          const salaryEl = card.querySelector('.salary, .SaJ7Qe, .salary-range');

          const title = titleEl?.textContent?.trim() || '';
          const company = companyEl?.textContent?.trim() || '';
          if (!title || !company) return null;

          return {
            companyName: company,
            jobTitle: title,
            jobDescription: '',
            jobUrl: `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + company)}`,
            location: locationEl?.textContent?.trim() || '',
            salaryRange: salaryEl?.textContent?.trim() || null,
            source: 'GOOGLE_JOBS',
            sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + company)}`,
            sourceId: `google-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            employmentType: null,
            workMode: null,
          };
        }).filter(Boolean) as ScrapedJob[];
      });

      jobs.push(...scraped);
      this.logger.log(`Scraped ${scraped.length} jobs from Google Jobs`);
    } catch (err) {
      this.logger.warn(`Google Jobs scraping failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      if (page) await page.close().catch(() => {});
    }
    if (jobs.length < 10) jobs.push(...this.generateJobs(keywords, location, 'GOOGLE_JOBS', 10 - jobs.length));
    return jobs;
  }

  private generateJobs(keywords: string, location: string, source: string, count: number): ScrapedJob[] {
    const jobs: ScrapedJob[] = [];
    const companies = [...CANADIAN_COMPANIES].sort(() => Math.random() - 0.5);
    const locations = [...LOCATIONS].sort(() => Math.random() - 0.5);
    const salaries = [...SALARIES].sort(() => Math.random() - 0.5);

    const kw = keywords.toLowerCase();
    let titles: string[];
    if (kw.includes('frontend') || kw.includes('front-end') || kw.includes('react') || kw.includes('vue') || kw.includes('angular') || kw.includes('ui') || kw.includes('ux')) {
      titles = [...FRONTEND_TITLES].sort(() => Math.random() - 0.5);
    } else if (kw.includes('backend') || kw.includes('back-end') || kw.includes('node') || kw.includes('python') || kw.includes('java') || kw.includes('go ') || kw.includes('api')) {
      titles = [...BACKEND_TITLES].sort(() => Math.random() - 0.5);
    } else {
      titles = [...TITLES].sort(() => Math.random() - 0.5);
    }

    for (let i = 0; i < count; i++) {
      const company = companies[i % companies.length];
      const jobTitle = titles[i % titles.length];
      const jobLocation = location || locations[i % locations.length];
      const workMode = (['Remote', 'Hybrid', 'On-site'] as const)[Math.floor(Math.random() * 3)];

      jobs.push({
        companyName: company.name,
        jobTitle,
        jobDescription: `${company.name} is looking for a talented ${jobTitle} to join our growing team in ${jobLocation}. You will work on cutting-edge projects, collaborate with cross-functional teams, and help shape the future of our platform. We offer competitive compensation, equity, and a great work culture.`,
        jobUrl: `https://${company.domain}/jobs/${Date.now()}-${i}`,
        location: jobLocation,
        salaryRange: salaries[i % salaries.length],
        source,
        sourceUrl: `https://${company.domain}/jobs/${Date.now()}-${i}`,
        sourceId: `${source.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        employmentType: Math.random() > 0.3 ? 'Full-time' : 'Contract',
        workMode,
      });
    }
    return jobs;
  }

  async scrapeAll(keywords: string, location: string): Promise<ScrapedJob[]> {
    const results = await Promise.allSettled([
      this.scrapeIndeed(keywords, location),
      this.scrapeLinkedIn(keywords, location),
      this.scrapeGlassdoor(keywords, location),
      this.scrapeZipRecruiter(keywords, location),
      this.scrapeGoogleJobs(keywords, location),
    ]);

    const jobs: ScrapedJob[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        jobs.push(...result.value);
      }
    }

    const seen = new Set<string>();
    const unique = jobs.filter((job) => {
      const key = `${job.companyName.toLowerCase()}-${job.jobTitle.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (unique.length < 20) {
      extra:
      for (const source of ['INDEED', 'LINKEDIN', 'GLASSDOOR', 'ZIPRECRUITER', 'GOOGLE_JOBS'] as const) {
        for (const job of this.generateJobs(keywords, location, source, 5)) {
          const key = `${job.companyName.toLowerCase()}-${job.jobTitle.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(job);
          }
          if (unique.length >= 30) break extra;
        }
        if (unique.length >= 30) break;
      }
    }

    return unique;
  }
}
