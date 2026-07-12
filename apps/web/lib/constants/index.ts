export const STATUS_BADGE: Record<string, 'gray' | 'blue' | 'purple' | 'orange' | 'amber' | 'emerald' | 'red'> = {
  SAVED: 'gray',
  APPLIED: 'blue',
  PHONE_SCREEN: 'purple',
  TECHNICAL: 'orange',
  ONSITE: 'amber',
  OFFER: 'emerald',
  REJECTED: 'red',
  WITHDREW: 'gray',
  ACCEPTED: 'emerald',
};

export const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Saved', value: 'SAVED' },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Phone Screen', value: 'PHONE_SCREEN' },
  { label: 'Technical', value: 'TECHNICAL' },
  { label: 'Onsite', value: 'ONSITE' },
  { label: 'Offer', value: 'OFFER' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Accepted', value: 'ACCEPTED' },
];

export const TYPE_BADGE: Record<string, 'purple' | 'orange' | 'amber' | 'blue' | 'red' | 'emerald'> = {
  PHONE: 'purple',
  TECHNICAL: 'orange',
  ONSITE: 'amber',
  BEHAVIORAL: 'blue',
  PANEL: 'red',
  FINAL: 'emerald',
};

export const SOURCE_BADGE: Record<string, 'blue' | 'orange' | 'purple' | 'green' | 'red' | 'gray' | 'cyan' | 'violet' | 'amber' | 'emerald'> = {
  LINKEDIN: 'blue',
  INDEED: 'orange',
  GLASSDOOR: 'purple',
  ZIPRECRUITER: 'green',
  WORKOPOLIS: 'amber',
  GREENHOUSE: 'emerald',
  LEVER: 'violet',
  WORKDAY: 'cyan',
};

export const SOURCE_LABELS: Record<string, string> = {
  LINKEDIN: 'LinkedIn',
  INDEED: 'Indeed',
  GLASSDOOR: 'Glassdoor',
  ZIPRECRUITER: 'ZipRecruiter',
  WORKOPOLIS: 'Workopolis',
  GREENHOUSE: 'Greenhouse',
  LEVER: 'Lever',
  WORKDAY: 'Workday',
};

export const ALL_SOURCES = ['GREENHOUSE', 'LEVER', 'WORKDAY', 'INDEED', 'WORKOPOLIS', 'LINKEDIN', 'ZIPRECRUITER'];

export const POSTED_OPTIONS = [
  { label: 'Any Time', value: '' },
  { label: 'Past 24 hours', value: 'H24' },
  { label: 'Past 3 days', value: 'D3' },
  { label: 'Past 7 days', value: 'D7' },
  { label: 'Past 14 days', value: 'D14' },
  { label: 'Past 30 days', value: 'D30' },
];

export const PAGE_SIZES = [5, 10, 20];

export const COLUMNS = [
  { key: 'companyName', label: 'Company', sortable: true },
  { key: 'jobTitle', label: 'Position', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Date', sortable: true },
];

export const TONES = ['professional', 'creative', 'enthusiastic'] as const;

export const INTERVIEW_TYPES = ['PHONE', 'TECHNICAL', 'ONSITE', 'BEHAVIORAL', 'PANEL', 'FINAL'] as const;

export const EXPERIENCE_LEVELS = [
  { value: '', label: 'Select level' },
  { value: 'ENTRY', label: 'Entry' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid-Level' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'EXECUTIVE', label: 'Executive' },
];

export const FUNNEL_LABELS: Record<string, string> = {
  saved: 'Saved', applied: 'Applied', phoneScreen: 'Phone Screen',
  technical: 'Technical', onsite: 'Onsite', offer: 'Offer',
  rejected: 'Rejected', accepted: 'Accepted',
};
