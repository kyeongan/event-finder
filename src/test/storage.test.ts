/**
 * Storage Utility Tests
 *
 * WHY THESE TESTS:
 * - localStorage is critical for user persistence (core requirement)
 * - Need to ensure data integrity across page refreshes
 * - Edge cases (null, invalid data) must be handled gracefully
 * - These functions are pure and easy to test, high value-to-effort ratio
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { saveAnswers, loadAnswers, clearAnswers, hasSavedAnswers } from '../utils/storage';

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure clean state
    localStorage.clear();
  });

  describe('saveAnswers and loadAnswers', () => {
    it('should save and retrieve answers correctly', () => {
      // WHY: Core functionality - users must be able to save progress
      const testAnswers = { location: 'New York, NY', eventType: 'Music' };

      saveAnswers(testAnswers);
      const loaded = loadAnswers();

      expect(loaded).toEqual(testAnswers);
    });

    it('should return null when no answers are saved', () => {
      // WHY: Initial state must be handled properly
      const loaded = loadAnswers();
      expect(loaded).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      // WHY: Corrupted localStorage should not crash the app
      localStorage.setItem('eventFinder_answers', 'invalid-json{');
      const loaded = loadAnswers();
      expect(loaded).toBeNull();
    });

    it('should overwrite existing answers', () => {
      // WHY: Users should be able to change their answers
      saveAnswers({ location: 'Boston, MA' });
      saveAnswers({ location: 'New York, NY' });

      const loaded = loadAnswers();
      expect(loaded).toEqual({ location: 'New York, NY' });
    });
  });

  describe('clearAnswers', () => {
    it('should remove saved answers', () => {
      // WHY: Users need to start fresh after completing a search
      saveAnswers({ location: 'Test' });
      clearAnswers();

      const loaded = loadAnswers();
      expect(loaded).toBeNull();
    });
  });

  describe('hasSavedAnswers', () => {
    it('should return true when answers exist', () => {
      // WHY: Resume prompt depends on this check
      saveAnswers({ location: 'Test' });
      expect(hasSavedAnswers()).toBe(true);
    });

    it('should return false when no answers exist', () => {
      expect(hasSavedAnswers()).toBe(false);
    });

    it('should return false for empty answers object', () => {
      // WHY: Empty object should not trigger resume prompt
      saveAnswers({});
      expect(hasSavedAnswers()).toBe(false);
    });
  });
});

/**
 * ADDITIONAL TESTS TO ADD WITH MORE TIME:
 *
 * 1. Edge Cases:
 *    - Very large objects (test localStorage limits)
 *    - Special characters in location names
 *    - Unicode/emoji in search terms
 *
 * 2. Security:
 *    - XSS attempts in stored values
 *    - Sanitization of loaded data
 *
 * 3. Performance:
 *    - Measure read/write speed with large datasets
 *    - Test concurrent access patterns
 *
 * 4. Browser Compatibility:
 *    - Test in browsers with localStorage disabled
 *    - Test in private/incognito mode
 */
