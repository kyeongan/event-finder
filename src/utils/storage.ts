/**
 * Local Storage Utilities
 *
 * Provides persistence for user answers and search progress.
 * Users can resume where they left off even after closing the browser.
 */

const STORAGE_KEY = 'eventFinder_answers';

export interface StorageError {
  success: false;
  error: string;
}

export interface StorageSuccess<T> {
  success: true;
  data: T;
}

export type StorageResult<T> = StorageSuccess<T> | StorageError;

/**
 * Save answers to localStorage
 * @returns Success status
 */
export function saveAnswers(answers: Record<string, any>): StorageResult<void> {
  try {
    if (!answers || typeof answers !== 'object') {
      return { success: false, error: 'Invalid answers object' };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to save answers to localStorage:', message);
    return { success: false, error: message };
  }
}

/**
 * Load answers from localStorage
 * @returns Parsed answers or null if not found/invalid
 */
export function loadAnswers(): Record<string, any> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Validate parsed data is an object
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.warn('Invalid answers format in localStorage, clearing...');
      clearAnswers();
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load answers from localStorage:', error);
    // Clear corrupted data
    clearAnswers();
    return null;
  }
}

/**
 * Clear saved answers
 */
export function clearAnswers(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear answers from localStorage:', error);
  }
}

/**
 * Check if there are saved answers
 */
export function hasSavedAnswers(): boolean {
  const answers = loadAnswers();
  return answers !== null && Object.keys(answers).length > 0;
}
