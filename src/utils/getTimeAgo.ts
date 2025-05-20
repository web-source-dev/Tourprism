/**
 * Get a human-readable relative time string (e.g., "3h ago")
 */
export const getTimeAgo = (timestamp: string): string => {
  if (!timestamp) return '';
  
  const now = new Date();
  const time = new Date(timestamp);
  const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
}; 