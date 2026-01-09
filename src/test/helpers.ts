/**
 * Test Helpers and Utilities
 */

import { vi } from 'vitest';

/**
 * Mock Supabase client for testing
 */
export const createMockSupabaseClient = () => {
  return {
    from: (table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  };
};

/**
 * Wait for async operations
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate mock UUID
 */
export const mockUUID = () => '00000000-0000-0000-0000-000000000000';

/**
 * Generate mock date string (YYYY-MM-DD)
 */
export const mockDate = (daysFromNow: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString('en-CA');
};
