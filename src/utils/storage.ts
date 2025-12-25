/**
 * Local Storage Utilities
 *
 * Provides persistence for user answers and search progress.
 * Users can resume where they left off even after closing the browser.
 */

import { Event } from '../types';

export interface AppState {
  stage: 'search' | 'loading' | 'results' | 'no-results';
  events: Event[];
  lastSearchParams: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  answers?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const STORAGE_KEYS = {
  APP_STATE: 'eventFinder_appState',
} as const;

/**
 * Save answers to localStorage (consolidated into APP_STATE)
 */
export function saveAnswers(answers: Record<string, any>): void { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const currentState = loadAppState();
    const updatedState: AppState = {
      stage: currentState?.stage || 'search',
      events: currentState?.events || [],
      lastSearchParams: currentState?.lastSearchParams || null,
      answers,
    };
    localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(updatedState));
  } catch (error) {
    console.error('Failed to save answers to localStorage:', error);
  }
}

/**
 * Load answers from localStorage (consolidated from APP_STATE)
 */
export function loadAnswers(): Record<string, any> | null { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const state = loadAppState();
    return state?.answers || null;
  } catch (error) {
    console.error('Failed to load answers from localStorage:', error);
    return null;
  }
}

/**
 * Clear saved answers (clears answers from APP_STATE)
 */
export function clearAnswers(): void {
  try {
    const currentState = loadAppState();
    if (currentState) {
      const updatedState: AppState = {
        ...currentState,
        answers: undefined,
      };
      localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(updatedState));
    }
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

/**
 * Save app state (stage, events, lastSearchParams, answers) to localStorage
 */
export function saveAppState(appState: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(appState));
  } catch (error) {
    console.error('Failed to save app state to localStorage:', error);
  }
}

/**
 * Load app state from localStorage
 */
export function loadAppState(): AppState | null {
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
