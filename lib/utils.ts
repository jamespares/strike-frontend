import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names using clsx and tailwind-merge
 * This is a common utility used across components for class name management
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 