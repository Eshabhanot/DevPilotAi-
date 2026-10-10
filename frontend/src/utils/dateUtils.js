/**
 * Date and time helper utilities
 */

export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatDuration(duration) {
  if (!duration) return '—';
  // Duration can be ISO-8601 string like PT0.12S or PT1M30S or numeric seconds/ms
  if (typeof duration === 'number') {
    return `${(duration / 1000).toFixed(2)}s`;
  }
  if (typeof duration === 'string' && duration.startsWith('PT')) {
    const seconds = duration.replace('PT', '').replace('S', '');
    return `${parseFloat(seconds).toFixed(2)}s`;
  }
  return String(duration);
}

export function timeAgo(isoString) {
  if (!isoString) return '—';
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return 'recently';
  }
}
