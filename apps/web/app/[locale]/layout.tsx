import type { Metadata } from 'next';
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/lib/theme';
import { ToasterProvider } from '@/components/providers/toaster-provider';

export const metadata: Metadata = {
  title: 'JobPilot AI — Smart Job Search Engine',
  description:
    'AI-powered platform to manage job applications, optimize resumes, generate cover letters, and prepare for interviews.',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>
        <QueryProvider>
          {children}
        </QueryProvider>
      </ThemeProvider>
      <ToasterProvider />
    </NextIntlClientProvider>
  );
}
