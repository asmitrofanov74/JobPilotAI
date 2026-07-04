'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { SCRAPE_JOBS_MUTATION } from '@/lib/graphql';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Search, Download, Briefcase, MapPin, DollarSign, ExternalLink, Globe } from 'lucide-react';

const SOURCE_BADGE: Record<string, 'blue' | 'orange' | 'purple'> = {
  LINKEDIN: 'blue',
  INDEED: 'orange',
  GLASSDOOR: 'purple',
};

export default function ScraperPage() {
  const [keywords, setKeywords] = useState('software engineer');
  const [location, setLocation] = useState('Toronto, ON');

  const scrape = useMutation({
    mutationFn: async () => {
      const { scrapeJobs } = await client.request(SCRAPE_JOBS_MUTATION, {
        input: { keywords, location, importAll: false },
      });
      return scrapeJobs;
    },
  });

  const importAll = useMutation({
    mutationFn: async () => {
      const { scrapeJobs } = await client.request(SCRAPE_JOBS_MUTATION, {
        input: { keywords, location, importAll: true },
      });
      return scrapeJobs;
    },
    onSuccess: () => {
      scrape.mutate();
    },
  });

  const jobs = scrape.data?.jobs ?? [];
  const total = scrape.data?.total ?? 0;
  const imported = scrape.data?.imported ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Scraper</h1>
        <p className="text-gray-500 mt-1">Search and import jobs from multiple sources</p>
      </div>

      <Card padding="md" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          Successfully imported {imported} job{imported !== 1 ? 's' : ''} to your applications.
        </div>
      )}

      {jobs.length > 0 && !scrape.isPending && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Found {total} jobs from {['Indeed', 'LinkedIn', 'Glassdoor'].join(', ')}
          </p>
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

      {!scrape.isPending && jobs.length === 0 && !scrape.data && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Search for jobs</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Enter keywords and location above to search for job listings from Indeed, LinkedIn, and Glassdoor.
          </p>
        </div>
      )}
    </div>
  );
}
