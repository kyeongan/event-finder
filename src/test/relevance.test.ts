/**
 * Relevance Scoring Tests
 *
 * Testing pure functions for event search relevance calculation.
 * Pure functions = deterministic, no side effects, easy to test.
 */

import { describe, it, expect } from 'vitest';
import { hasKeywordMatch, matchesClassification, matchesCity, calculateRelevanceFactors, calculateRelevanceScore, type RelevanceFactors } from '../../backend/src/relevance';

describe('Relevance Scoring', () => {
  describe('hasKeywordMatch', () => {
    it('matches keyword in event name (case-insensitive, partial)', () => {
      expect(hasKeywordMatch('Taylor Swift Concert', 'swift')).toBe(true);
      expect(hasKeywordMatch('Rock Festival', 'Jazz')).toBe(false);
      expect(hasKeywordMatch('Basketball', 'ball')).toBe(true);
    });

    it('returns null when no keyword provided', () => {
      expect(hasKeywordMatch('Event', undefined)).toBe(null);
    });
  });

  describe('matchesClassification', () => {
    it('matches classification exactly (case-insensitive)', () => {
      expect(matchesClassification('Sports', 'sports')).toBe(true);
      expect(matchesClassification('Sports', 'Music')).toBe(false);
    });

    it('returns null when no classification search provided', () => {
      expect(matchesClassification('Sports', undefined)).toBe(null);
    });
  });

  describe('matchesCity', () => {
    it('matches city with bidirectional substring matching', () => {
      expect(matchesCity('Boston', 'boston')).toBe(true);
      expect(matchesCity('Boston, MA', 'Boston')).toBe(true);
      expect(matchesCity('Boston', 'Boston, MA')).toBe(true);
      expect(matchesCity('Boston', 'Chicago')).toBe(false);
    });

    it('returns null when no city search provided', () => {
      expect(matchesCity('Boston', undefined)).toBe(null);
    });
  });

  describe('calculateRelevanceFactors', () => {
    it('combines all match factors correctly', () => {
      const factors = calculateRelevanceFactors({ name: 'Taylor Swift Concert', city: 'Boston', classification: 'Music' }, { keyword: 'Taylor', city: 'Boston', classificationName: 'Music' }, 1);

      expect(factors).toEqual({
        position: 1,
        hasKeywordMatch: true,
        matchesClassification: true,
        matchesCity: true,
      });
    });

    it('handles missing search criteria', () => {
      const factors = calculateRelevanceFactors({ name: 'Concert' }, {}, 5);

      expect(factors).toEqual({
        position: 5,
        hasKeywordMatch: null,
        matchesClassification: null,
        matchesCity: null,
      });
    });
  });

  describe('calculateRelevanceScore', () => {
    it('scores position 1 with all matches = 100 (capped)', () => {
      // 20 + 18 + 30 + 25 + 25 = 118 → 100
      expect(
        calculateRelevanceScore({
          position: 1,
          hasKeywordMatch: true,
          matchesClassification: true,
          matchesCity: true,
        })
      ).toBe(100);
    });

    it('scores no matches = 20 (base score only)', () => {
      expect(
        calculateRelevanceScore({
          position: 100,
          hasKeywordMatch: false,
          matchesClassification: false,
          matchesCity: false,
        })
      ).toBe(20);
    });

    it('applies position bonus for top 10 results', () => {
      // Position 1: 20 + 18 = 38
      // Position 10: 20 + 0 = 20
      // Position 11: 20 + 0 = 20
      expect(calculateRelevanceScore({ position: 1, hasKeywordMatch: null, matchesClassification: null, matchesCity: null })).toBe(38);
      expect(calculateRelevanceScore({ position: 10, hasKeywordMatch: null, matchesClassification: null, matchesCity: null })).toBe(20);
      expect(calculateRelevanceScore({ position: 11, hasKeywordMatch: null, matchesClassification: null, matchesCity: null })).toBe(20);
    });

    it('awards correct points per match factor', () => {
      const base = { position: 15, hasKeywordMatch: null, matchesClassification: null, matchesCity: null };

      expect(calculateRelevanceScore({ ...base, hasKeywordMatch: true })).toBe(50); // 20 + 30
      expect(calculateRelevanceScore({ ...base, matchesClassification: true })).toBe(45); // 20 + 25
      expect(calculateRelevanceScore({ ...base, matchesCity: true })).toBe(45); // 20 + 25
    });

    it('treats null same as false (no penalty)', () => {
      const withNulls = calculateRelevanceScore({ position: 5, hasKeywordMatch: null, matchesClassification: null, matchesCity: null });
      const withFalse = calculateRelevanceScore({ position: 5, hasKeywordMatch: false, matchesClassification: false, matchesCity: false });

      expect(withNulls).toBe(30); // 20 + 10
      expect(withFalse).toBe(30);
    });
  });
});
