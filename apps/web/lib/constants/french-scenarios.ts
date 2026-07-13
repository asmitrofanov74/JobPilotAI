import { Mic, Users, BookOpen, MessageSquare, Coffee } from 'lucide-react';

export interface FrenchScenarioMeta {
  value: string;
  label: string;
  icon: any;
  desc: string;
  color: string;
  bg: string;
}

export const FRENCH_SCENARIO_RECORD: Record<string, FrenchScenarioMeta> = {
  job_interview: {
    value: 'job_interview',
    label: 'Job Interview',
    icon: Mic,
    desc: 'Practice French interview questions',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  recruiter_call: {
    value: 'recruiter_call',
    label: 'Recruiter Call',
    icon: Users,
    desc: 'Simulate calls with French recruiters',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  team_meeting: {
    value: 'team_meeting',
    label: 'Team Meeting',
    icon: BookOpen,
    desc: 'Participate in French team discussions',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  daily_standup: {
    value: 'daily_standup',
    label: 'Daily Standup',
    icon: MessageSquare,
    desc: 'Share updates in a French standup',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  office_conversation: {
    value: 'office_conversation',
    label: 'Office Chat',
    icon: Coffee,
    desc: 'Casual French office conversations',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
};

export const FRENCH_SCENARIOS = Object.values(FRENCH_SCENARIO_RECORD);
