import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

const SECTIONS = [
  'common', 'nav', 'auth', 'dashboard', 'jobs', 'resumes', 'cover-letters',
  'settings', 'skills', 'interviews', 'analytics', 'scraper',
  'interview-coach', 'french-coach', 'linkedin', 'language',
];

const messageCache = new Map<string, Record<string, string>>();

async function loadMessages(locale: string): Promise<Record<string, string>> {
  const cached = messageCache.get(locale);
  if (cached) return cached;

  const results = await Promise.all(
    SECTIONS.map(async (section) => {
      try {
        const mod = await import(`../messages/${locale}/${section}.json`);
        return mod.default as Record<string, string>;
      } catch {
        return {} as Record<string, string>;
      }
    }),
  );

  const messages: Record<string, string> = {};
  for (const section of results) {
    Object.assign(messages, section);
  }

  messageCache.set(locale, messages);
  return messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = await loadMessages(locale);
  return { locale, messages };
});
