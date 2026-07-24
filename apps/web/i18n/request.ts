import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

const SECTIONS = [
  'common', 'nav', 'auth', 'dashboard', 'jobs', 'resumes', 'cover-letters',
  'settings', 'skills', 'interviews', 'analytics', 'scraper',
  'interview-coach', 'french-coach', 'linkedin', 'language',
];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages: Record<string, string> = {};
  for (const section of SECTIONS) {
    try {
      const mod = await import(`../messages/${locale}/${section}.json`);
      Object.assign(messages, mod.default);
    } catch {
      // section file missing — skip
    }
  }

  return { locale, messages };
});
