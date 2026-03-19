import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

/**
 * Utility Functions Tests
 */
describe('Utils', () => {
  describe('cn (class name utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      expect(cn('base', isActive && 'active')).toBe('base active');
    });

    it('should handle false conditions', () => {
      const isActive = false;
      expect(cn('base', isActive && 'active')).toBe('base');
    });

    it('should resolve Tailwind class conflicts', () => {
      // tailwind-merge should resolve conflicts
      expect(cn('px-4', 'px-8')).toBe('px-8');
    });

    it('should handle empty strings', () => {
      expect(cn('', 'px-4')).toBe('px-4');
    });

    it('should handle undefined and null', () => {
      expect(cn('px-4', undefined, null)).toBe('px-4');
    });
  });
});

