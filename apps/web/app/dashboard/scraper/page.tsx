'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { SCRAPE_JOBS_MUTATION, IMPORT_JOBS_MUTATION } from '@/lib/graphql';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Search, Download, MapPin, DollarSign, ExternalLink, Globe, Clock } from 'lucide-react';

const SOURCE_BADGE: Record<string, 'blue' | 'orange' | 'purple' | 'green' | 'red' | 'gray' | 'cyan' | 'violet' | 'amber' | 'emerald'> = {
  LINKEDIN: 'blue',
  INDEED: 'orange',
  GLASSDOOR: 'purple',
  ZIPRECRUITER: 'green',
  WORKOPOLIS: 'amber',
  GREENHOUSE: 'emerald',
  LEVER: 'violet',
  WORKDAY: 'cyan',
};

const SOURCE_LABELS: Record<string, string> = {
  LINKEDIN: 'LinkedIn',
  INDEED: 'Indeed',
  GLASSDOOR: 'Glassdoor',
  ZIPRECRUITER: 'ZipRecruiter',
  WORKOPOLIS: 'Workopolis',
  GREENHOUSE: 'Greenhouse',
  LEVER: 'Lever',
  WORKDAY: 'Workday',
};

const ALL_SOURCES = ['GREENHOUSE', 'LEVER', 'WORKDAY', 'INDEED', 'WORKOPOLIS', 'LINKEDIN', 'ZIPRECRUITER'];

const POSTED_OPTIONS = [
  { label: 'Any Time', value: '' },
  { label: 'Past 24 hours', value: 'H24' },
  { label: 'Past 3 days', value: 'D3' },
  { label: 'Past 7 days', value: 'D7' },
  { label: 'Past 14 days', value: 'D14' },
  { label: 'Past 30 days', value: 'D30' },
];

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Posted 1 min ago' : `Posted ${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? 'Posted 1 hour ago' : `Posted ${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? 'Posted 1 day ago' : `Posted ${days} days ago`;
  return `Posted ${Math.floor(days / 30)} months ago`;
}

export default function ScraperPage() {
  const [keywords, setKeywords] = useState('software engineer');
  const [location, setLocation] = useState('Toronto, ON');

  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [postedWithin, setPostedWithin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  const scrape = useMutation({
    mutationFn: async () => {
      setErrorMsg('');
      importAll.reset();
      const { scrapeJobs } = await client.request(SCRAPE_JOBS_MUTATION, {
        input: { keywords, location, importAll: false, postedWithin: postedWithin || undefined, source: sourceFilter === 'ALL' ? undefined : sourceFilter },
      });
      return scrapeJobs;
    },
    onError: (err: any) => {
      setErrorMsg('Search failed. Please try again.');
      console.error('Scrape error:', err);
    },
  });

  const importAll = useMutation({
    mutationFn: async () => {
      const { importJobs } = await client.request(IMPORT_JOBS_MUTATION, {
        jobs: jobs.map((j: any) => ({
          companyName: j.companyName,
          jobTitle: j.jobTitle,
          jobDescription: j.jobDescription,
          jobUrl: j.jobUrl,
          location: j.location,
          salaryRange: j.salaryRange,
          source: j.source,
          sourceUrl: j.sourceUrl,
          sourceId: j.sourceId,
          status: 'SAVED',
        })),
      });
      return importJobs;
    },
    onSuccess: () => {
      setTimeout(() => { importAll.reset(); }, 8000);
    },
    onError: (err: any) => {
      setErrorMsg('Import failed');
      console.error('Import error:', err);
    },
  });

  const jobs = scrape.data?.jobs ?? [];
  const total = scrape.data?.total ?? 0;
  const imported = importAll.data?.imported ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Scraper</h1>
        <p className="text-gray-500 mt-1">Search and import jobs from multiple sources</p>
      </div>

      <Card padding="md" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. software engineer"
          />
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Toronto, ON"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Sources</option>
              {ALL_SOURCES.map((s) => (
                <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Posted Date</label>
            <select
              value={postedWithin}
              onChange={(e) => setPostedWithin(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {POSTED_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => scrape.mutate()} loading={scrape.isPending}>
            <Search className="w-4 h-4" />
            Search Jobs
          </Button>
          {jobs.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => importAll.mutate()}
              loading={importAll.isPending}
            >
              <Download className="w-4 h-4" />
              Import All ({jobs.length})
            </Button>
          )}
        </div>
      </Card>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{errorMsg}</div>
      )}

      {scrape.isPending && (
        <div className="flex justify-center py-16">
          <div className="text-center space-y-3">
            <Spinner />
            <p className="text-sm text-gray-400">Scraping job listings...</p>
          </div>
        </div>
      )}

      {imported > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">
          Imported {imported} job{imported !== 1 ? 's' : ''}
          {importAll.data?.skipped ? `, ${importAll.data.skipped} already in your list` : ''}
        </div>
      )}

      {jobs.length > 0 && !scrape.isPending && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Found {total} jobs{sourceFilter !== 'ALL' ? ` from ${SOURCE_LABELS[sourceFilter]}` : ''}
          </p>
          {scrape.data?.stats && (
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {ALL_SOURCES.filter((s) => (scrape.data?.stats as any)?.[s.toLowerCase()] > 0).map((s) => (
                <span key={s} className="flex items-center gap-1">
                  <Badge variant={SOURCE_BADGE[s] || 'gray'}>{SOURCE_LABELS[s]}</Badge>
                  {(scrape.data?.stats as any)?.[s.toLowerCase()] || 0}
                </span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3">
            {jobs.map((job: any, i: number) => (
              <Card key={i} padding="md" className="hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={SOURCE_BADGE[job.source] || 'gray'}>{job.source}</Badge>
                      {job.employmentType && (
                        <span className="text-xs text-gray-400">{job.employmentType}</span>
                      )}
                      {job.workMode && (
                        <span className="text-xs text-gray-400">· {job.workMode}</span>
                      )}
                      {job.postedDate && (
                        <span className="text-xs text-gray-400 ml-auto">{relativeTime(job.postedDate)}</span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 truncate">{job.jobTitle}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{job.companyName}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      {job.salaryRange && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {job.salaryRange}
                        </span>
                      )}
                      {job.jobUrl && (
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      )}
                    </div>
                    {job.jobDescription && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{job.jobDescription}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!scrape.isPending && jobs.length === 0 && scrape.data && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          No jobs found. All job providers returned 0 results. Try different keywords or location, or check <code className="bg-amber-100 px-1 rounded">SCRAPER_PROVIDERS</code> in <code className="bg-amber-100 px-1 rounded">apps/api/.env</code>.
        </div>
      )}

      {!scrape.isPending && jobs.length === 0 && !scrape.data && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Search for jobs</h3>
          <p className="text-sm text-gray-500 max-w-sm">
             Enter keywords and location above to search real job listings.
          </p>
        </div>
      )}
    </div>
  );
}
