export function formatDate(iso: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' });
}

export function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Posted 1 min ago' : `Posted ${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? 'Posted 1 hour ago' : `Posted ${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? 'Posted 1 day ago' : `Posted ${days} days ago`;
  return `Posted ${Math.floor(days / 30)} months ago`;
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
