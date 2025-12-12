/**
 * Relevance Scoring Tests
 *
 * WHY TEST PURE FUNCTIONS:
 * - Deterministic: Same inputs always produce same outputs
 * - No side effects: Easy to test, no mocks needed
 * - Critical logic: Affects what users see in search results
 * - Easy to break: Changes to scoring logic can introduce bugs
 * - Fast tests: No I/O, no async operations
 * - Regression prevention: Algorithm changes shouldn't break unexpectedly
 */

import { describe, it, expect } from 'vitest';
import { hasKeywordMatch, matchesClassification, matchesCity, calculateRelevanceFactors, calculateRelevanceScore, type RelevanceFactors } from '../../backend/src/relevance';

describe('Relevance Scoring - Pure Functions', () => {
  describe('hasKeywordMatch', () => {
    it('should return true when keyword matches event name', () => {
      // WHY: Basic matching is the most common use case
      expect(hasKeywordMatch('Taylor Swift Concert', 'Taylor')).toBe(true);
      expect(hasKeywordMatch('Taylor Swift Concert', 'Swift')).toBe(true);
      expect(hasKeywordMatch('Taylor Swift Concert', 'Concert')).toBe(true);
    });

    it('should be case-insensitive', () => {
      // WHY: Users shouldn't need to match case exactly
      expect(hasKeywordMatch('Taylor Swift Concert', 'TAYLOR')).toBe(true);
      expect(hasKeywordMatch('Taylor Swift Concert', 'taylor')).toBe(true);
      expect(hasKeywordMatch('TAYLOR SWIFT', 'taylor swift')).toBe(true);
    });

    it('should return false when keyword does not match', () => {
      // WHY: Non-matching results should be identified
      expect(hasKeywordMatch('Taylor Swift Concert', 'Beatles')).toBe(false);
      expect(hasKeywordMatch('Rock Festival', 'Jazz')).toBe(false);
    });

    it('should return null when no keyword provided', () => {
      // WHY: Distinguish between "no match" and "no search criteria"
      expect(hasKeywordMatch('Taylor Swift Concert', undefined)).toBe(null);
      expect(hasKeywordMatch('Taylor Swift Concert', '')).toBe(null);
    });

    it('should return false for empty event name', () => {
      // WHY: Handle malformed data gracefully
      expect(hasKeywordMatch('', 'concert')).toBe(false);
    });

    it('should match partial words', () => {
      // WHY: Substring matching is more user-friendly
      expect(hasKeywordMatch('Basketball Championship', 'ball')).toBe(true);
      expect(hasKeywordMatch('Symphony Orchestra', 'phony')).toBe(true);
    });
  });

  describe('matchesClassification', () => {
    it('should return true for exact classification match', () => {
      // WHY: Users filtering by classification expect exact matches
      expect(matchesClassification('Sports', 'Sports')).toBe(true);
      expect(matchesClassification('Music', 'Music')).toBe(true);
    });

    it('should be case-insensitive', () => {
      // WHY: API might return different casing than user input
      expect(matchesClassification('Sports', 'sports')).toBe(true);
      expect(matchesClassification('MUSIC', 'music')).toBe(true);
      expect(matchesClassification('Arts & Theatre', 'ARTS & THEATRE')).toBe(true);
    });

    it('should return false for non-matching classification', () => {
      // WHY: Different classifications should not match
      expect(matchesClassification('Sports', 'Music')).toBe(false);
      expect(matchesClassification('Music', 'Theatre')).toBe(false);
    });

    it('should return null when no classification search provided', () => {
      // WHY: User not filtering by classification
      expect(matchesClassification('Sports', undefined)).toBe(null);
      expect(matchesClassification('Music', '')).toBe(null);
    });

    it('should return false for undefined event classification', () => {
      // WHY: Events without classification cannot match
      expect(matchesClassification(undefined, 'Sports')).toBe(false);
    });
  });

  describe('matchesCity', () => {
    it('should match exact city names', () => {
      // WHY: Exact matches are the most common case
      expect(matchesCity('Boston', 'Boston')).toBe(true);
      expect(matchesCity('New York', 'New York')).toBe(true);
    });

    it('should be case-insensitive', () => {
      // WHY: City names might have different casing
      expect(matchesCity('Boston', 'boston')).toBe(true);
      expect(matchesCity('NEW YORK', 'new york')).toBe(true);
    });

    it('should match when search includes state code', () => {
      // WHY: Users often search "Boston, MA" but API returns "Boston"
      expect(matchesCity('Boston', 'Boston, MA')).toBe(true);
      expect(matchesCity('New York', 'New York, NY')).toBe(true);
    });

    it('should match when event includes state code', () => {
      // WHY: API might return "Boston, MA" but user searches "Boston"
      expect(matchesCity('Boston, MA', 'Boston')).toBe(true);
      expect(matchesCity('New York, NY', 'New York')).toBe(true);
    });

    it('should match partial city names', () => {
      // WHY: Bidirectional substring matching for flexibility
      expect(matchesCity('San Francisco', 'San')).toBe(true);
      expect(matchesCity('Los Angeles', 'Angeles')).toBe(true);
    });

    it('should return false for non-matching cities', () => {
      // WHY: Different cities should not match
      expect(matchesCity('Boston', 'Chicago')).toBe(false);
      expect(matchesCity('New York', 'Los Angeles')).toBe(false);
    });

    it('should return null when no city search provided', () => {
      // WHY: User not filtering by city
      expect(matchesCity('Boston', undefined)).toBe(null);
      expect(matchesCity('New York', '')).toBe(null);
    });

    it('should return false for undefined event city', () => {
      // WHY: Events without city cannot match
      expect(matchesCity(undefined, 'Boston')).toBe(false);
    });
  });

  describe('calculateRelevanceFactors', () => {
    it('should calculate all factors correctly', () => {
      // WHY: Integration test ensuring all individual functions work together
      const event = {
        name: 'Taylor Swift Concert',
        city: 'Boston',
        classification: 'Music',
      };

      const searchCriteria = {
        keyword: 'Taylor',
        city: 'Boston',
        classificationName: 'Music',
      };

      const factors = calculateRelevanceFactors(event, searchCriteria, 1);

      expect(factors).toEqual({
        position: 1,
        hasKeywordMatch: true,
        matchesClassification: true,
        matchesCity: true,
      });
    });

    it('should handle missing search criteria', () => {
      // WHY: Not all searches include all criteria
      const event = {
        name: 'Taylor Swift Concert',
        city: 'Boston',
        classification: 'Music',
      };

      const factors = calculateRelevanceFactors(event, {}, 5);

      expect(factors).toEqual({
        position: 5,
        hasKeywordMatch: null,
        matchesClassification: null,
        matchesCity: null,
      });
    });

    it('should handle missing event data', () => {
      // WHY: API data might be incomplete
      const event = {
        name: 'Concert',
      };

      const searchCriteria = {
        keyword: 'Concert',
        city: 'Boston',
        classificationName: 'Music',
      };

      const factors = calculateRelevanceFactors(event, searchCriteria, 10);

      expect(factors).toEqual({
        position: 10,
        hasKeywordMatch: true,
        matchesClassification: false,
        matchesCity: false,
      });
    });

    it('should handle mixed matches', () => {
      // WHY: Real searches often have partial matches
      const event = {
        name: 'Rock Concert',
        city: 'Chicago',
        classification: 'Music',
      };

      const searchCriteria = {
        keyword: 'Concert',
        city: 'Boston',
        classificationName: 'Music',
      };

      const factors = calculateRelevanceFactors(event, searchCriteria, 3);

      expect(factors).toEqual({
        position: 3,
        hasKeywordMatch: true,
        matchesClassification: true,
        matchesCity: false,
      });
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should give perfect score for top result with all matches', () => {
      // WHY: Best possible result should score highest
      const factors: RelevanceFactors = {
        position: 1,
        hasKeywordMatch: true,
        matchesClassification: true,
        matchesCity: true,
      };

      const score = calculateRelevanceScore(factors);
      expect(score).toBe(100); // 20 base + 18 position + 30 keyword + 25 class + 25 city
    });

    it('should give base score when no matches', () => {
      // WHY: Even poor matches should have minimum score
      const factors: RelevanceFactors = {
        position: 100,
        hasKeywordMatch: false,
        matchesClassification: false,
        matchesCity: false,
      };

      const score = calculateRelevanceScore(factors);
      expect(score).toBe(20); // Base score only
    });

    it('should penalize lower positions', () => {
      // WHY: Position in results matters (API relevance)
      const topResult: RelevanceFactors = {
        position: 1,
        hasKeywordMatch: null,
        matchesClassification: null,
        matchesCity: null,
      };

      const lowerResult: RelevanceFactors = {
        position: 10,
        hasKeywordMatch: null,
        matchesClassification: null,
        matchesCity: null,
      };

      expect(calculateRelevanceScore(topResult)).toBeGreaterThan(calculateRelevanceScore(lowerResult));
    });

    it('should score keyword matches highly', () => {
      // WHY: Keyword matching is important for search relevance
      const withKeyword: RelevanceFactors = {
        position: 5,
        hasKeywordMatch: true,
        matchesClassification: null,
        matchesCity: null,
      };

      const withoutKeyword: RelevanceFactors = {
        position: 5,
        hasKeywordMatch: false,
        matchesClassification: null,
        matchesCity: null,
      };

      expect(calculateRelevanceScore(withKeyword)).toBe(calculateRelevanceScore(withoutKeyword) + 30);
    });

    it('should handle null factors correctly', () => {
      // WHY: Null means "not searched for", should not penalize
      const withNulls: RelevanceFactors = {
        position: 5,
        hasKeywordMatch: null,
        matchesClassification: null,
        matchesCity: null,
      };

      const withFalse: RelevanceFactors = {
        position: 5,
        hasKeywordMatch: false,
        matchesClassification: false,
        matchesCity: false,
      };

      // Both should give same score (base + position)
      expect(calculateRelevanceScore(withNulls)).toBe(calculateRelevanceScore(withFalse));
    });

    it('should cap score at 100', () => {
      // WHY: Prevent scores exceeding maximum
      // Even if algorithm changes, score should be capped
      const maxFactors: RelevanceFactors = {
        position: 1,
        hasKeywordMatch: true,
        matchesClassification: true,
        matchesCity: true,
      };

      expect(calculateRelevanceScore(maxFactors)).toBeLessThanOrEqual(100);
    });

    it('should produce consistent scores for same inputs', () => {
      // WHY: Pure function must be deterministic
      const factors: RelevanceFactors = {
        position: 3,
        hasKeywordMatch: true,
        matchesClassification: false,
        matchesCity: true,
      };

      const score1 = calculateRelevanceScore(factors);
      const score2 = calculateRelevanceScore(factors);
      const score3 = calculateRelevanceScore(factors);

      expect(score1).toBe(score2);
      expect(score2).toBe(score3);
    });
  });
});

/**
 * ADDITIONAL TESTS TO ADD WITH MORE TIME:
 *
 * 1. Property-Based Testing:
 *    - Use fast-check or similar to generate random inputs
 *    - Verify score always between 0-100
 *    - Verify determinism with random inputs
 *
 * 2. Edge Cases:
 *    - Very long event names and keywords
 *    - Special characters in city names (e.g., "O'Fallon")
 *    - Unicode characters in event names
 *    - Null vs undefined vs empty string handling
 *
 * 3. Performance Tests:
 *    - Benchmark scoring performance with large datasets
 *    - Verify O(1) complexity for scoring
 *
 * 4. Scoring Algorithm Validation:
 *    - Test weight distribution is balanced
 *    - Verify position decay curve is appropriate
 *    - Compare scores of similar events for consistency
 *
 * 5. Real-World Scenarios:
 *    - Use actual Ticketmaster API responses
 *    - Test with production search patterns
 *    - Verify scoring matches user expectations
 */
