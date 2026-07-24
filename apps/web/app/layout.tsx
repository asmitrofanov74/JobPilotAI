import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JobPilot AI — Smart Job Search Engine',
  description:
    'AI-powered platform to manage job applications, optimize resumes, generate cover letters, and prepare for interviews.',
  keywords: [
    'job search',
    'AI',
    'resume optimization',
    'cover letter',
    'interview preparation',
    'tech jobs',
    'Canada',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
