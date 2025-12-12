/**
 * Relevance Scoring Module
 *
 * Pure functions for calculating event relevance based on search criteria.
 * These functions are deterministic and have no side effects, making them
 * ideal candidates for comprehensive unit testing.
 */

export interface RelevanceFactors {
  position: number;
  hasKeywordMatch: boolean | null;
  matchesClassification: boolean | null;
  matchesCity: boolean | null;
}

export interface EventData {
  name: string;
  city?: string;
  classification?: string;
}

export interface SearchCriteria {
  keyword?: string;
  city?: string;
  classificationName?: string;
}

/**
 * Calculate keyword match relevance
 * WHY PURE: No side effects, deterministic output for same inputs
 *
 * @param eventName - The name of the event
 * @param keyword - The search keyword (optional)
 * @returns true if keyword matches, false if doesn't match, null if no keyword provided
 */
export function hasKeywordMatch(eventName: string, keyword?: string): boolean | null {
  if (!keyword) return null;
  if (!eventName) return false;

  return eventName.toLowerCase().includes(keyword.toLowerCase());
}

/**
 * Calculate classification match relevance
 * WHY PURE: Simple string comparison, no external dependencies
 *
 * @param eventClassification - The event's classification/segment
 * @param searchClassification - The desired classification (optional)
 * @returns true if matches, false if doesn't match, null if no classification provided
 */
export function matchesClassification(eventClassification?: string, searchClassification?: string): boolean | null {
  if (!searchClassification) return null;
  if (!eventClassification) return false;

  return eventClassification.toLowerCase() === searchClassification.toLowerCase();
}

/**
 * Calculate city match relevance
 * WHY PURE: Bidirectional string matching logic, testable edge cases
 *
 * Uses bidirectional matching to handle cases where:
 * - Search: "Boston" → Event: "Boston" ✓
 * - Search: "Boston, MA" → Event: "Boston" ✓
 * - Search: "Boston" → Event: "Boston, MA" ✓
 *
 * @param eventCity - The event's city name
 * @param searchCity - The desired city (optional)
 * @returns true if matches, false if doesn't match, null if no city provided
 */
export function matchesCity(eventCity?: string, searchCity?: string): boolean | null {
  if (!searchCity) return null;
  if (!eventCity) return false;

  const eventCityLower = eventCity.toLowerCase();
  const searchCityLower = searchCity.toLowerCase();

  // Bidirectional matching: "Boston" matches "Boston, MA" and vice versa
  return eventCityLower.includes(searchCityLower) || searchCityLower.includes(eventCityLower);
}

/**
 * Calculate all relevance factors for an event
 * WHY PURE: Composes other pure functions, deterministic, no side effects
 *
 * @param event - The event data
 * @param searchCriteria - The search criteria
 * @param position - The position in search results (1-based)
 * @returns Object containing all relevance factors
 */
export function calculateRelevanceFactors(event: EventData, searchCriteria: SearchCriteria, position: number): RelevanceFactors {
  return {
    position,
    hasKeywordMatch: hasKeywordMatch(event.name, searchCriteria.keyword),
    matchesClassification: matchesClassification(event.classification, searchCriteria.classificationName),
    matchesCity: matchesCity(event.city, searchCriteria.city),
  };
}

/**
 * Calculate a relevance score (0-100)
 * WHY PURE: Scoring algorithm with clear weights, fully testable
 *
 * Scoring weights:
 * - Position: Lower is better (inverse scaling)
 * - Keyword match: 30 points
 * - Classification match: 25 points
 * - City match: 25 points
 * - Base score: 20 points
 *
 * @param factors - The relevance factors
 * @returns A score from 0-100
 */
export function calculateRelevanceScore(factors: RelevanceFactors): number {
  let score = 20; // Base score

  // Position penalty (first result gets more points)
  // Results 1-10 get bonus points, diminishing returns
  if (factors.position <= 10) {
    score += (10 - factors.position) * 2; // 0-18 points
  }

  // Keyword match bonus
  if (factors.hasKeywordMatch === true) {
    score += 30;
  }

  // Classification match bonus
  if (factors.matchesClassification === true) {
    score += 25;
  }

  // City match bonus
  if (factors.matchesCity === true) {
    score += 25;
  }

  return Math.min(score, 100); // Cap at 100
}
