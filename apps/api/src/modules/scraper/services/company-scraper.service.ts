import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GreenhouseProvider } from '../providers/greenhouse.provider';
import { LeverProvider } from '../providers/lever.provider';
import { WorkdayProvider } from '../providers/workday.provider';
import { NormalizedJob } from '../providers/normalized-job.interface';
import { AtsDiscoveryService } from './ats-discovery.service';

const execAsync = promisify(exec);
const CURL_TIMEOUT = 15;

function providerFromUrl(url: string): 'GREENHOUSE' | 'LEVER' | 'WORKDAY' | null {
  if (url.includes('greenhouse.io') || url.includes('boards.greenhouse.io')) return 'GREENHOUSE';
  if (url.includes('lever.co')) return 'LEVER';
  if (url.includes('myworkdayjobs.com') || url.includes('wd5.myworkday')) return 'WORKDAY';
  return null;
}

function boardFromUrl(url: string): string | null {
  const ghMatch = url.match(/greenhouse\.io\/(?:boards\/)?(\w+)/);
  if (ghMatch) return ghMatch[1];
  const leverMatch = url.match(/lever\.co\/(\w+)/);
  if (leverMatch) return leverMatch[1];
  const wdMatch = url.match(/https:\/\/(\w+)\.wd\d\.myworkdayjobs\.com/);
  if (wdMatch) return wdMatch[1];
  return null;
}

@Injectable()
export class CompanyScraperService {
  private readonly logger = new Logger(CompanyScraperService.name);

  constructor(
    private readonly greenhouse: GreenhouseProvider,
    private readonly lever: LeverProvider,
    private readonly workday: WorkdayProvider,
    private readonly atsDiscovery: AtsDiscoveryService,
  ) {}

  async detectAndScrape(careerUrl: string, query?: string): Promise<NormalizedJob[]> {
    let provider = providerFromUrl(careerUrl);
    let board = boardFromUrl(careerUrl);

    if (!provider) {
      provider = await this.detectProvider(careerUrl);
      if (!provider) {
        this.logger.warn(`Could not detect ATS provider for ${careerUrl}`);
        return [];
      }
      board = boardFromUrl(careerUrl);
    }

    if (!board) {
      board = await this.extractBoardName(careerUrl, provider);
    }

    if (!board) {
      this.logger.warn(`Could not extract board name from ${careerUrl}`);
      return [];
    }

    const company = this.guessCompanyName(careerUrl, board);

    this.atsDiscovery.register({ companyName: company, careerUrl, providerType: provider });

    const params = { query: query || '', location: undefined };
    switch (provider) {
      case 'GREENHOUSE':
        return this.scrapeSingleGreenhouse(board, company, params);
      case 'LEVER':
        return this.scrapeSingleLever(board, company, params);
      case 'WORKDAY':
        return this.scrapeSingleWorkday(board, company, params);
    }
  }

  private async scrapeSingleGreenhouse(board: string, company: string, params: { query: string }): Promise<NormalizedJob[]> {
    const result: NormalizedJob[] = [];
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`;
      const data = await this.curlJson(url);
      const items: any[] = data.jobs || [];
      const q = params.query.toLowerCase();

      for (const job of items) {
        const title = job.title || '';
        if (!title) continue;
        if (q && !title.toLowerCase().includes(q)) continue;

        const office = job.offices?.[0];
        const jobLocation = office ? `${office.name}${office.city ? `, ${office.city}` : ''}` : '';
        const content = (job.content || '').replace(/<[^>]*>/g, '').slice(0, 2000);

        result.push({
          title, company, location: jobLocation, description: content,
          source: 'GREENHOUSE',
          sourceUrl: `https://boards.greenhouse.io/${board}/jobs/${job.id}`,
          postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
        });
      }
    } catch (err) {
      this.logger.warn(`Company scrape Greenhouse ${board}: ${err instanceof Error ? err.message : String(err)}`);
    }
    return result;
  }

  private async scrapeSingleLever(board: string, company: string, params: { query: string }): Promise<NormalizedJob[]> {
    const result: NormalizedJob[] = [];
    try {
      const url = `https://api.lever.co/v0/postings/${board}?mode=json`;
      const data: any[] = await this.curlJson(url);
      const q = params.query.toLowerCase();

      for (const job of data || []) {
        const title = job.text || '';
        if (!title) continue;
        if (q && !title.toLowerCase().includes(q)) continue;

        result.push({
          title, company,
          location: job.categories?.location || '',
          description: (job.descriptionPlain || job.description || '').slice(0, 2000),
          source: 'LEVER',
          sourceUrl: job.hostedUrl || `https://jobs.lever.co/${board}/${job.id}`,
          postedAt: job.createdAt ? new Date(job.createdAt) : undefined,
        });
      }
    } catch (err) {
      this.logger.warn(`Company scrape Lever ${board}: ${err instanceof Error ? err.message : String(err)}`);
    }
    return result;
  }

  private async scrapeSingleWorkday(board: string, company: string, params: { query: string }): Promise<NormalizedJob[]> {
    const result: NormalizedJob[] = [];
    try {
      const url = `https://${board}.wd5.myworkdayjobs.com/wday/cxs/${board}/${company}/jobs`;
      const body = JSON.stringify({ limit: 20, offset: 0, searchText: params.query || '' });
      const data = await this.curlJson(url, 'POST', body);
      const items: any[] = data.jobPostings || [];
      const q = params.query.toLowerCase();

      for (const job of items) {
        const title = job.title || '';
        if (!title) continue;
        if (q && !title.toLowerCase().includes(q)) continue;

        result.push({
          title, company,
          location: job.locations?.[0] || '',
          description: (job.jobDescription || '').replace(/<[^>]*>/g, '').slice(0, 2000),
          source: 'WORKDAY',
          sourceUrl: job.externalPath
            ? `https://${board}.wd5.myworkdayjobs.com/en-US/${company}${job.externalPath}`
            : `https://${board}.wd5.myworkdayjobs.com/en-US/${company}/job/${job.id}`,
          postedAt: job.publicatioDate ? new Date(job.publicatioDate) : undefined,
        });
      }
    } catch (err) {
      this.logger.warn(`Company scrape Workday ${board}: ${err instanceof Error ? err.message : String(err)}`);
    }
    return result;
  }

  private async detectProvider(url: string): Promise<'GREENHOUSE' | 'LEVER' | 'WORKDAY' | null> {
    try {
      const { stdout } = await execAsync(`curl -sL --max-time ${CURL_TIMEOUT} "${url}"`, { timeout: 20000 });
      const html = stdout.toLowerCase();
      if (html.includes('greenhouse.io')) return 'GREENHOUSE';
      if (html.includes('lever.co')) return 'LEVER';
      if (html.includes('myworkdayjobs.com') || html.includes('workday')) return 'WORKDAY';
    } catch {
      // ignore
    }
    return null;
  }

  private async extractBoardName(url: string, provider: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`curl -sL --max-time ${CURL_TIMEOUT} "${url}"`, { timeout: 20000 });
      const html = stdout.toLowerCase();

      if (provider === 'GREENHOUSE') {
        for (const prefix of ['/boards/', 'greenhouse.io/']) {
          const idx = html.indexOf(prefix);
          if (idx >= 0) {
            const after = html.slice(idx + prefix.length);
            const end = after.search(/[/"'\s?]/);
            return end > 0 ? after.slice(0, end) : after.slice(0, 30);
          }
        }
        const match = html.match(/greenhouse\.io\/(?:boards\/)?(\w+)/);
        if (match) return match[1];
      }

      if (provider === 'LEVER') {
        const match = html.match(/lever\.co\/(\w+)/);
        if (match) return match[1];
      }

      if (provider === 'WORKDAY') {
        const match = html.match(/https:\/\/(\w+)\.wd\d\.myworkdayjobs\.com/);
        if (match) return match[1];
      }
    } catch {
      // ignore
    }
    return null;
  }

  private guessCompanyName(url: string, board: string): string {
    const parsed = new URL(url);
    const parts = parsed.hostname.replace('www.', '').split('.');
    if (parts[0] !== 'boards' && parts[0] !== 'api') {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    if (parts.length > 1) return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    return board.charAt(0).toUpperCase() + board.slice(1);
  }

  private async curlJson(url: string, method = 'GET', body?: string): Promise<any> {
    let cmd = `curl -s --max-time ${CURL_TIMEOUT} "${url}"`;
    if (method === 'POST') {
      cmd += ` -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d '${body}'`;
    }
    try {
      const { stdout } = await execAsync(cmd, { timeout: CURL_TIMEOUT * 1000 + 5000 });
      return JSON.parse(stdout);
    } catch (err: any) {
      if (err.stdout) {
        try { return JSON.parse(err.stdout); } catch { /* not JSON */ }
      }
      throw err;
    }
  }
}
