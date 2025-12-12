import { useState } from 'react';
import { SearchForm, SearchParams } from './components/SearchForm';
import { EventResults } from './components/EventResults';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loading } from './components/Loading';
import { eventApi } from './services/api';
import { Event } from './types';
import './App.css';

/**
 * Main App Component
 *
 * Manages the application state and flow between:
 * 1. Search form (user inputs)
 * 2. Loading state (fetching events)
 * 3. Results display (showing filtered events)
 */
function App() {
  const [stage, setStage] = useState<'search' | 'loading' | 'results'>('search');
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (params: SearchParams) => {
    setStage('loading');
    setError(null);

    try {
      const response = await eventApi.searchEvents(params);

      if (response.events.length === 0) {
        setError('No events found matching your criteria. Please try different search parameters.');
        setStage('search');
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
