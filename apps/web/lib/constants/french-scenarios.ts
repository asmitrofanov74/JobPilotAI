import { Mic, Users, BookOpen, MessageSquare, Coffee, Briefcase } from 'lucide-react';

export interface FrenchScenarioMeta {
  value: string;
  label: string;
  icon: any;
  desc: string;
  color: string;
  bg: string;
}

export const FRENCH_SCENARIO_RECORD: Record<string, FrenchScenarioMeta> = {
  JOB_INTERVIEW: {
    value: 'JOB_INTERVIEW',
    label: 'Job Interview',
    icon: Mic,
    desc: 'Practice French interview questions',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  RECRUITER_CALL: {
    value: 'RECRUITER_CALL',
    label: 'Recruiter Call',
    icon: Users,
    desc: 'Simulate calls with French recruiters',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  TEAM_MEETING: {
    value: 'TEAM_MEETING',
    label: 'Team Meeting',
    icon: BookOpen,
    desc: 'Participate in French team discussions',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  DAILY_STANDUP: {
    value: 'DAILY_STANDUP',
    label: 'Daily Standup',
    icon: MessageSquare,
    desc: 'Share updates in a French standup',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  OFFICE_CONVERSATION: {
    value: 'OFFICE_CONVERSATION',
    label: 'Office Chat',
    icon: Coffee,
    desc: 'Casual French office conversations',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  CUSTOM_JOB: {
    value: 'CUSTOM_JOB',
    label: 'Custom Job',
    icon: Briefcase,
    desc: 'Paste a job description for tailored practice',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
};

export const FRENCH_SCENARIOS = Object.values(FRENCH_SCENARIO_RECORD);
