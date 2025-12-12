import { useState } from 'react';
import { QuestionFlow } from './components/QuestionFlow';
import { EventResults } from './components/EventResults';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loading } from './components/Loading';
import { eventApi } from './services/api';
import { Event } from './types';
import './App.css';

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
  const [stage, setStage] = useState<'search' | 'loading' | 'results' | 'no-results'>('search');
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);

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

          {stage === 'search' && <QuestionFlow onComplete={handleSearch} />}

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
