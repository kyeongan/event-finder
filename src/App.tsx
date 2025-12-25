import { useState, useEffect } from 'react';
import { EventResults } from './components/EventResults';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loading } from './components/Loading';
import { eventApi } from './services/api';
import { Event } from './types';
import { saveAppState, loadAppState, clearAppState, AppState } from './utils/storage';
import './App.css';
import { SearchForm } from './components/SearchForm';

export interface SearchParams {
  location: string;
  dateRange: string;
  eventType: string;
  keywords?: string;
}

/**
 * Main App Component
 *
 * Manages the application state and flow between:
 * 1. Question flow (configurable multi-step form)
 * 2. Loading state (fetching events)
 * 3. Results display (showing filtered events)
 */
function App() {
  // Initialize state from localStorage if available
  const savedState = loadAppState();

  // Validate saved stage value
  const isValidStage = (stage: any): stage is 'search' | 'loading' | 'results' | 'no-results' => {
    return ['search', 'loading', 'results', 'no-results'].includes(stage);
  };

  const [stage, setStage] = useState<'search' | 'loading' | 'results' | 'no-results'>(savedState?.stage && isValidStage(savedState.stage) ? savedState.stage : 'search');
  const [events, setEvents] = useState<Event[]>(savedState?.events || []);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(savedState?.lastSearchParams || null);

  // Save app state to localStorage whenever it changes
  useEffect(() => {
    if (stage === 'results' || stage === 'no-results') {
      const currentState = loadAppState();
      const appState: AppState = {
        stage,
        events,
        lastSearchParams,
        answers: currentState?.answers, // Preserve answers
      };
      saveAppState(appState);
    } else if (stage === 'search') {
      // Clear saved state when starting a new search
      clearAppState();
    }
  }, [stage, events, lastSearchParams]);

  const handleSearch = async (params: SearchParams | Record<string, unknown>) => {
    setStage('loading');
    setError(null);

    try {
      const searchParams = params as SearchParams;
      setLastSearchParams(searchParams);
      const response = await eventApi.searchEvents(searchParams);

      if (response.events.length === 0) {
        setStage('no-results');
        return;
      }

      setEvents(response.events);
      setStage('results');
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to fetch events. Please try again.');
      setStage('search');
    }
  };

  const handleStartOver = () => {
    setStage('search');
    // Keep events visible - don't clear them
    setError(null);
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">🎉 Event Finder</h1>
          <p className="app-subtitle">Discover amazing events tailored to your interests</p>
        </header>

        <main className="app-main">
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
              <button className="error-close" onClick={() => setError(null)} aria-label="Close error message">
                ×
              </button>
            </div>
          )}

          {stage === 'search' && <SearchForm onSearch={handleSearch} />}

          {stage === 'loading' && <Loading message="Searching for events..." />}

          {stage === 'no-results' && (
            <div className="no-results-container">
              <div className="no-results-icon">🔍</div>
              <h2 className="no-results-title">No Events Found</h2>
              <p className="no-results-message">We couldn't find any events matching your search criteria.</p>
              {lastSearchParams && (
                <div className="search-criteria">
                  <p className="criteria-label">You searched for:</p>
                  <ul className="criteria-list">
                    <li>
                      📍 <strong>Location:</strong> {lastSearchParams.location}
                    </li>
                    {lastSearchParams.dateRange && (
                      <li>
                        📅 <strong>When:</strong> {lastSearchParams.dateRange.replace(/-/g, ' ')}
                      </li>
                    )}
                    {lastSearchParams.eventType && (
                      <li>
                        🎭 <strong>Type:</strong> {lastSearchParams.eventType}
                      </li>
                    )}
                    {lastSearchParams.keywords && (
                      <li>
                        🔎 <strong>Keywords:</strong> {lastSearchParams.keywords}
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <div className="no-results-suggestions">
                <p className="suggestions-title">Try these suggestions:</p>
                <ul className="suggestions-list">
                  <li>✓ Broaden your date range</li>
                  <li>✓ Try a nearby city</li>
                  <li>✓ Remove specific keywords</li>
                  <li>✓ Select "All Types" for event category</li>
                </ul>
              </div>
              <button className="btn-search-again" onClick={handleStartOver}>
                ← Try New Search
              </button>
            </div>
          )}

          {stage === 'results' && <EventResults events={events} onStartOver={handleStartOver} />}
        </main>

        <footer className="app-footer">
          <p>Built with React, TypeScript, and Ticketmaster API</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
