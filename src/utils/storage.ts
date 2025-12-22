/**
 * Local Storage Utilities
 *
 * Provides persistence for user answers and search progress.
 * Users can resume where they left off even after closing the browser.
 */

const STORAGE_KEYS = {
  ANSWERS: 'eventFinder_answers',
  LAST_SEARCH: 'eventFinder_lastSearch',
  SEARCH_HISTORY: 'eventFinder_searchHistory',
  APP_STATE: 'eventFinder_appState',
} as const;

/**
 * Save answers to localStorage
 */
export function saveAnswers(answers: Record<string, any>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
  } catch (error) {
    console.error('Failed to save answers to localStorage:', error);
  }
}

/**
 * Load answers from localStorage
 */
export function loadAnswers(): Record<string, any> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ANSWERS);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load answers from localStorage:', error);
    return null;
  }
}

/**
 * Clear saved answers
 */
export function clearAnswers(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
  } catch (error) {
    console.error('Failed to clear answers from localStorage:', error);
  }
}

/**
 * Save last search parameters
 */
export function saveLastSearch(searchParams: Record<string, any>): void {
  try {
    const searchData = {
      params: searchParams,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.LAST_SEARCH, JSON.stringify(searchData));
  } catch (error) {
    console.error('Failed to save last search to localStorage:', error);
  }
}

/**
 * Load last search parameters
 */
export function loadLastSearch(): { params: Record<string, any>; timestamp: string } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_SEARCH);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load last search from localStorage:', error);
    return null;
  }
}

/**
 * Add search to history
 */
export function addToSearchHistory(searchParams: Record<string, any>): void {
  try {
    const history = getSearchHistory();
    const newEntry = {
      params: searchParams,
      timestamp: new Date().toISOString(),
    };

    // Keep only last 10 searches
    const updatedHistory = [newEntry, ...history].slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to add to search history:', error);
  }
}

/**
 * Get search history
 */
export function getSearchHistory(): Array<{ params: Record<string, any>; timestamp: string }> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get search history:', error);
    return [];
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
}

/**
 * Check if there are saved answers
 */
export function hasSavedAnswers(): boolean {
  const answers = loadAnswers();
  return answers !== null && Object.keys(answers).length > 0;
}

/**
 * Save app state (stage, events, lastSearchParams) to localStorage
 */
export function saveAppState(appState: {
  stage: string;
  events: any[];
  lastSearchParams: any;
}): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(appState));
  } catch (error) {
    console.error('Failed to save app state to localStorage:', error);
  }
}

/**
 * Load app state from localStorage
 */
export function loadAppState(): {
  stage: string;
  events: any[];
  lastSearchParams: any;
} | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.APP_STATE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load app state from localStorage:', error);
    return null;
  }
}

/**
 * Clear saved app state
 */
export function clearAppState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.APP_STATE);
  } catch (error) {
    console.error('Failed to clear app state from localStorage:', error);
  }
}
