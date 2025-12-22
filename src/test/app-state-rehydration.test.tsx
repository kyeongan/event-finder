/**
 * App State Rehydration Integration Test
 *
 * WHY THIS TEST:
 * - Verifies the complete flow of saving and restoring app state after page refresh
 * - Tests the main requirement: "refreshing a browser should rehydrate local storage"
 * - Simulates the user journey from search to results to refresh
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { saveAppState, loadAppState, clearAppState, AppState } from '../utils/storage';

describe('App State Rehydration Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should persist results page state and restore after simulated refresh', () => {
    // Simulate user completing a search and arriving at results page
    const mockEvents = [
      {
        id: '1',
        name: 'Summer Music Festival',
        url: 'https://example.com/event1',
        date: '2024-07-15',
        venue: 'Central Park',
        city: 'New York',
        state: 'NY',
        genre: 'Music',
        relevanceFactors: {
          position: 1,
          hasKeywordMatch: true,
          matchesClassification: true,
          matchesCity: true,
        },
      },
      {
        id: '2',
        name: 'Jazz Night',
        url: 'https://example.com/event2',
        date: '2024-07-20',
        venue: 'Blue Note',
        city: 'New York',
        state: 'NY',
        genre: 'Jazz',
        relevanceFactors: {
          position: 2,
          hasKeywordMatch: false,
          matchesClassification: true,
          matchesCity: true,
        },
      },
    ];

    const mockSearchParams = {
      location: 'New York, NY',
      dateRange: 'next-month',
      eventType: 'Music',
      keywords: 'festival',
    };

    const appState: AppState = {
      stage: 'results',
      events: mockEvents,
      lastSearchParams: mockSearchParams,
    };

    // STEP 1: User completes search - app saves state
    saveAppState(appState);

    // Verify state was saved
    expect(localStorage.getItem('eventFinder_appState')).not.toBeNull();

    // STEP 2: User refreshes the page - browser clears all state
    // (simulated by loading state from localStorage)
    const restoredState = loadAppState();

    // STEP 3: Verify all state is restored correctly
    expect(restoredState).not.toBeNull();
    expect(restoredState?.stage).toBe('results');
    expect(restoredState?.events).toHaveLength(2);
    expect(restoredState?.events[0].name).toBe('Summer Music Festival');
    expect(restoredState?.events[1].name).toBe('Jazz Night');
    expect(restoredState?.lastSearchParams?.location).toBe('New York, NY');
    expect(restoredState?.lastSearchParams?.eventType).toBe('Music');
    expect(restoredState?.lastSearchParams?.keywords).toBe('festival');
  });

  it('should handle no-results page state rehydration', () => {
    const appState: AppState = {
      stage: 'no-results',
      events: [],
      lastSearchParams: {
        location: 'Smalltown, USA',
        dateRange: 'today',
        eventType: 'Opera',
      },
    };

    // User gets no results and page is saved
    saveAppState(appState);

    // User refreshes
    const restoredState = loadAppState();

    // No-results page should be restored with search params
    expect(restoredState?.stage).toBe('no-results');
    expect(restoredState?.events).toHaveLength(0);
    expect(restoredState?.lastSearchParams?.location).toBe('Smalltown, USA');
  });

  it('should start fresh when user initiates new search', () => {
    // User had previous results
    const oldState: AppState = {
      stage: 'results',
      events: [
        {
          id: '1',
          name: 'Old Event',
          url: 'http://example.com',
          relevanceFactors: {
            position: 1,
            hasKeywordMatch: null,
            matchesClassification: null,
            matchesCity: null,
          },
        },
      ],
      lastSearchParams: { location: 'Old Location' },
    };
    saveAppState(oldState);

    // User clicks "Start New Search" - app clears state
    clearAppState();

    // State should be cleared
    const restoredState = loadAppState();
    expect(restoredState).toBeNull();
  });

  it('should handle page refresh during search stage without errors', () => {
    // If user refreshes during search (before results), no app state should exist
    const restoredState = loadAppState();
    
    // Should return null, not throw error
    expect(restoredState).toBeNull();
  });

  it('should preserve all event details through refresh', () => {
    const detailedEvent = {
      id: 'Z7r9jZ1AdF9w3',
      name: 'Taylor Swift | The Eras Tour',
      url: 'https://www.ticketmaster.com/event/12345',
      image: 'https://example.com/image.jpg',
      date: '2024-08-15',
      time: '19:00:00',
      venue: 'MetLife Stadium',
      city: 'East Rutherford',
      state: 'NJ',
      country: 'US',
      classification: 'Music',
      genre: 'Pop',
      subGenre: 'Pop Rock',
      priceRanges: [
        {
          type: 'standard',
          currency: 'USD',
          min: 49.5,
          max: 299.5,
        },
      ],
      status: 'onsale',
      relevanceFactors: {
        position: 1,
        hasKeywordMatch: true,
        matchesClassification: true,
        matchesCity: true,
      },
    };

    const detailedState: AppState = {
      stage: 'results',
      events: [detailedEvent],
      lastSearchParams: { location: 'East Rutherford, NJ' },
    };
    saveAppState(detailedState);

    const restored = loadAppState();
    const restoredEvent = restored?.events[0];

    // Verify all fields are preserved
    expect(restoredEvent).toEqual(detailedEvent);
    expect(restoredEvent?.priceRanges).toBeDefined();
    expect(restoredEvent?.priceRanges?.[0].min).toBe(49.5);
    expect(restoredEvent?.relevanceFactors.position).toBe(1);
  });

  it('should handle multiple events with complex data', () => {
    // Create 20 events to test with larger dataset
    const manyEvents = Array.from({ length: 20 }, (_, i) => ({
      id: `event-${i}`,
      name: `Event ${i}`,
      url: `https://example.com/event${i}`,
      date: '2024-08-01',
      city: 'New York',
      state: 'NY',
      relevanceFactors: {
        position: i + 1,
        hasKeywordMatch: i % 2 === 0,
        matchesClassification: true,
        matchesCity: true,
      },
    }));

    const manyEventsState: AppState = {
      stage: 'results',
      events: manyEvents,
      lastSearchParams: { location: 'New York, NY' },
    };
    saveAppState(manyEventsState);

    const restored = loadAppState();

    expect(restored?.events).toHaveLength(20);
    expect(restored?.events[0].name).toBe('Event 0');
    expect(restored?.events[19].name).toBe('Event 19');
  });
});
