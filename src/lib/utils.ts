import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatDate(timestamp: number | string | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : 
               typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const addSuffix = options?.addSuffix;
  
  // Convert to appropriate time unit
  let value: number;
  let unit: string;
  
  if (diffInSeconds < 60) {
    value = diffInSeconds;
    unit = value === 1 ? 'second' : 'seconds';
  } else if (diffInSeconds < 3600) {
    value = Math.floor(diffInSeconds / 60);
    unit = value === 1 ? 'minute' : 'minutes';
  } else if (diffInSeconds < 86400) {
    value = Math.floor(diffInSeconds / 3600);
    unit = value === 1 ? 'hour' : 'hours';
  } else if (diffInSeconds < 2592000) {
    value = Math.floor(diffInSeconds / 86400);
    unit = value === 1 ? 'day' : 'days';
  } else if (diffInSeconds < 31536000) {
    value = Math.floor(diffInSeconds / 2592000);
    unit = value === 1 ? 'month' : 'months';
  } else {
    value = Math.floor(diffInSeconds / 31536000);
    unit = value === 1 ? 'year' : 'years';
  }
  
  // Format the output
  if (addSuffix) {
    if (diffInSeconds < 0) {
      return `in ${Math.abs(value)} ${unit}`;
    } else {
      return `${value} ${unit} ago`;
    }
  } else {
    return `${value} ${unit}`;
  }
}
