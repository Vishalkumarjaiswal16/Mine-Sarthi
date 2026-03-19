import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dataService } from '@/services/dataService';

/**
 * Data Service Tests
 */
describe('DataService', () => {
  beforeEach(() => {
    // Reset service state before each test
    vi.clearAllMocks();
  });

  describe('isUsingMockData', () => {
    it('should return true by default', () => {
      // Service defaults to mock data
      expect(dataService.isUsingMockData()).toBe(true);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return true when using mock data', () => {
      expect(dataService.getConnectionStatus()).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('should allow subscription to data updates', () => {
      const callback = vi.fn();
      const unsubscribe = dataService.subscribe('metrics', callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Cleanup
      unsubscribe();
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = dataService.subscribe('equipment', callback);
      
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
      
      // Should not throw when unsubscribing
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('sendCommand', () => {
    it('should log command when using mock data', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      dataService.sendCommand('test-command', { param: 'value' });
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});

