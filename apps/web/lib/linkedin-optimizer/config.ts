import { UserCheck, Sparkles, FileText, BarChart3, Search, Eye, type LucideIcon } from 'lucide-react';

export interface PageConfig {
  title: string;
  description: string;
  historyIcon: LucideIcon;
  historyIconColor: string;
  historyLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  historyDisplayField?: string;
}

export const PAGE_CONFIGS: Record<string, PageConfig> = {
  profile_analysis: {
    title: 'LinkedIn Optimizer',
    description: 'Analyze and optimize your LinkedIn profile for maximum impact',
    historyIcon: UserCheck,
    historyIconColor: 'text-blue-500',
    historyLabel: 'Previous Analyses',
    emptyTitle: 'No analyses yet',
    emptyDescription: 'Run your first profile analysis',
    historyDisplayField: 'overallScore',
  },
  headline: {
    title: 'Headline Generator',
    description: 'Create compelling, keyword-rich headlines that attract recruiters',
    historyIcon: Sparkles,
    historyIconColor: 'text-purple-500',
    historyLabel: 'Previous Generations',
    emptyTitle: 'No headlines yet',
    emptyDescription: 'Generate your first set of headlines',
    historyDisplayField: 'bestHeadline',
  },
  about: {
    title: 'About Section Generator',
    description: 'Write compelling professional stories that showcase your expertise',
    historyIcon: FileText,
    historyIconColor: 'text-indigo-500',
    historyLabel: 'Previous Generations',
    emptyTitle: 'No about sections yet',
    emptyDescription: 'Generate your first About section',
    historyDisplayField: 'bestSection',
  },
  experience_optimizer: {
    title: 'Experience Optimizer',
    description: 'Rewrite work experience with strong action verbs and quantified achievements',
    historyIcon: BarChart3,
    historyIconColor: 'text-amber-500',
    historyLabel: 'Previous Optimizations',
    emptyTitle: 'No optimizations yet',
    emptyDescription: 'Optimize your first experience entry',
    historyDisplayField: 'optimizedEntries',
  },
  resume_comparison: {
    title: 'Resume vs LinkedIn Comparison',
    description: 'Align your resume with your LinkedIn profile for consistency',
    historyIcon: Search,
    historyIconColor: 'text-cyan-500',
    historyLabel: 'Previous Comparisons',
    emptyTitle: 'No comparisons yet',
    emptyDescription: 'Compare your first resume with LinkedIn',
    historyDisplayField: 'consistencyScore',
  },
  visibility_analysis: {
    title: 'Recruiter Visibility Analyzer',
    description: 'Improve your discoverability in recruiter searches',
    historyIcon: Eye,
    historyIconColor: 'text-violet-500',
    historyLabel: 'Previous Analyses',
    emptyTitle: 'No analyses yet',
    emptyDescription: 'Run your first visibility analysis',
    historyDisplayField: 'visibilityScore',
  },
};

export const TONE_OPTIONS: Record<string, string[]> = {
  headline: ['professional', 'innovative', 'confident', 'friendly'],
  about: ['professional', 'storytelling', 'results-driven', 'conversational'],
  experience: ['professional', 'impact-driven', 'concise'],
};
