export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'unknown time';
  }

  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string provided to formatDate:', dateString);
    return 'invalid date';
  }

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);
  const diffInMin = Math.floor(diffInSec / 60);
  const diffInHour = Math.floor(diffInMin / 60);
  const diffInDay = Math.floor(diffInHour / 24);

  if (diffInSec < 60) {
    return 'just now';
  } else if (diffInMin < 60) {
    return `${diffInMin}m ago`;
  } else if (diffInHour < 24) {
    return `${diffInHour}h ago`;
  } else if (diffInDay < 7) {
    return `${diffInDay}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const formatFullDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'Unknown date';
  }

  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string provided to formatFullDate:', dateString);
    return 'Invalid date';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateMUStudentId = (studentId: string): boolean => {
  const muIdRegex = /^\d{3}-\d{3}-\d{3}$/;
  return muIdRegex.test(studentId);
};

export const validateMUEmail = (email: string): boolean => {
  return email.endsWith('@metro.edu') || email.endsWith('.edu');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

export const generateAvatarColor = (name: string): string => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  const charCodeSum = name
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  return colors[charCodeSum % colors.length];
};

export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

export const formatNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  return (num / 1000000).toFixed(1) + 'M';
};

export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

export const classNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const parseHashtags = (text: string): string => {
  return text.replace(
    /#(\w+)/g,
    '<span class="text-primary-600 font-medium">#$1</span>'
  );
};

export const parseMentions = (text: string): string => {
  return text.replace(
    /@(\w+)/g,
    '<span class="text-primary-600 font-medium">@$1</span>'
  );
};

export const formatPostContent = (text: string): string => {
  let formatted = text;
  formatted = parseHashtags(formatted);
  formatted = parseMentions(formatted);
  return formatted;
};

export const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const safeFormatDistanceToNow = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return 'unknown time';
  }

  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string provided to safeFormatDistanceToNow:', dateString);
    return 'invalid date';
  }

  try {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSec = Math.floor(diffInMs / 1000);
    const diffInMin = Math.floor(diffInSec / 60);
    const diffInHour = Math.floor(diffInMin / 60);
    const diffInDay = Math.floor(diffInHour / 24);

    if (diffInSec < 60) {
      return 'just now';
    } else if (diffInMin < 60) {
      return `${diffInMin} minute${diffInMin !== 1 ? 's' : ''} ago`;
    } else if (diffInHour < 24) {
      return `${diffInHour} hour${diffInHour !== 1 ? 's' : ''} ago`;
    } else if (diffInDay < 7) {
      return `${diffInDay} day${diffInDay !== 1 ? 's' : ''} ago`;
    } else if (diffInDay < 30) {
      const weeks = Math.floor(diffInDay / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else if (diffInDay < 365) {
      const months = Math.floor(diffInDay / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInDay / 365);
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'unknown time';
  }
};
