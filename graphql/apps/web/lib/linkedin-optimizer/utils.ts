export function parseCommaSeparated(value: string): string[] {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

export function priorityVariant(priority: string): 'red' | 'amber' | 'blue' {
  if (priority === 'high') return 'red';
  if (priority === 'medium') return 'amber';
  return 'blue';
}

export function toneLabel(tone: string): string {
  return tone.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
