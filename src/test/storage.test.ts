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
import { 
  saveAnswers, 
  loadAnswers, 
  clearAnswers, 
  hasSavedAnswers, 
  saveLastSearch, 
  loadLastSearch, 
  addToSearchHistory, 
  getSearchHistory, 
  clearSearchHistory,
  saveAppState,
  loadAppState,
  clearAppState,
  AppState
} from '../utils/storage';

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

  describe('saveLastSearch and loadLastSearch', () => {
    it('should save search with timestamp', () => {
      // WHY: Track when searches were made for analytics/history
      const searchParams = { location: 'Chicago, IL', eventType: 'Sports' };

      saveLastSearch(searchParams);
      const loaded = loadLastSearch();

      expect(loaded?.params).toEqual(searchParams);
      expect(loaded?.timestamp).toBeDefined();
      expect(typeof loaded?.timestamp).toBe('string');
    });

    it('should return null when no last search exists', () => {
      expect(loadLastSearch()).toBeNull();
    });
  });

  describe('Search History', () => {
    it('should add searches to history', () => {
      // WHY: Users should see their recent searches
      addToSearchHistory({ location: 'Boston' });
      addToSearchHistory({ location: 'New York' });

      const history = getSearchHistory();
      expect(history).toHaveLength(2);
      expect(history[0].params).toEqual({ location: 'New York' }); // Most recent first
    });

    it('should limit history to 10 items', () => {
      // WHY: Prevent localStorage from growing unbounded
      for (let i = 0; i < 15; i++) {
        addToSearchHistory({ location: `City ${i}` });
      }

      const history = getSearchHistory();
      expect(history).toHaveLength(10);
    });

    it('should clear search history', () => {
      // WHY: Users may want to clear their search history
      addToSearchHistory({ location: 'Test' });
      clearSearchHistory();

      const history = getSearchHistory();
      expect(history).toEqual([]);
    });

    it('should return empty array when no history exists', () => {
      expect(getSearchHistory()).toEqual([]);
    });
  });

  describe('App State Persistence', () => {
    it('should save and retrieve app state correctly', () => {
      // WHY: Users should not lose their results when refreshing the page
      const testState: AppState = {
        stage: 'results',
        events: [
          { 
            id: '1', 
            name: 'Concert', 
            url: 'http://example.com',
            relevanceFactors: {
              position: 1,
              hasKeywordMatch: null,
              matchesClassification: null,
              matchesCity: null,
            }
          },
          { 
            id: '2', 
            name: 'Game', 
            url: 'http://example.com',
            relevanceFactors: {
              position: 2,
              hasKeywordMatch: null,
              matchesClassification: null,
              matchesCity: null,
            }
          }
        ],
        lastSearchParams: { location: 'New York, NY', eventType: 'Music' }
      };

      saveAppState(testState);
      const loaded = loadAppState();

      expect(loaded).toEqual(testState);
    });

    it('should return null when no app state is saved', () => {
      // WHY: Initial load should handle missing state gracefully
      const loaded = loadAppState();
      expect(loaded).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      // WHY: Corrupted localStorage should not crash the app
      localStorage.setItem('eventFinder_appState', 'invalid-json{');
      const loaded = loadAppState();
      expect(loaded).toBeNull();
    });

    it('should clear saved app state', () => {
      // WHY: Users should start fresh when initiating a new search
      const testState: AppState = {
        stage: 'results',
        events: [
          { 
            id: '1', 
            name: 'Test', 
            url: 'http://example.com',
            relevanceFactors: {
              position: 1,
              hasKeywordMatch: null,
              matchesClassification: null,
              matchesCity: null,
            }
          }
        ],
        lastSearchParams: { location: 'Test' }
      };
      saveAppState(testState);
      clearAppState();

      const loaded = loadAppState();
      expect(loaded).toBeNull();
    });

    it('should preserve app state across page refresh', () => {
      // WHY: This is the core requirement - state must survive refresh
      const state: AppState = {
        stage: 'results',
        events: [
          { 
            id: '123', 
            name: 'Summer Festival', 
            url: 'http://example.com',
            relevanceFactors: {
              position: 1,
              hasKeywordMatch: null,
              matchesClassification: null,
              matchesCity: null,
            }
          }
        ],
        lastSearchParams: { 
          location: 'Los Angeles, CA',
          dateRange: 'next-week',
          eventType: 'Festival'
        }
      };

      saveAppState(state);
      
      // Simulate page refresh by loading state
      const rehydrated = loadAppState();
      
      expect(rehydrated).not.toBeNull();
      expect(rehydrated?.stage).toBe('results');
      expect(rehydrated?.events).toHaveLength(1);
      expect(rehydrated?.events[0].name).toBe('Summer Festival');
      expect(rehydrated?.lastSearchParams?.location).toBe('Los Angeles, CA');
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
