import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * 
 * Combines clsx and tailwind-merge to handle conditional classes
 * and resolve Tailwind class conflicts intelligently.
 * 
 * @param {...ClassValue} inputs - Class names or conditional class objects
 * @returns {string} Merged class string
 * 
 * @example
 * ```typescript
 * cn('px-4', 'py-2', isActive && 'bg-primary', 'text-white')
 * // Returns: "px-4 py-2 bg-primary text-white" (if isActive is true)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
