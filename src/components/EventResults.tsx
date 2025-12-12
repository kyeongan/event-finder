import React, { useState, useMemo } from 'react';
import { Event } from '../types';
import './EventResults.css';

interface EventResultsProps {
  events: Event[];
  onStartOver: () => void;
}

/**
 * EventResults component displays search results in a table
 *
 * Features:
 * - Table view with sorting
 * - Filtering by multiple criteria
 * - Relevance transparency tooltips
 * - Price range display
 * - Responsive design
 */
export const EventResults: React.FC<EventResultsProps> = ({ events, onStartOver }) => {
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    genre: '',
    priceRange: 'all',
  });
  const [sortBy, setSortBy] = useState<'date' | 'relevance' | 'name'>('relevance');
  const [showTooltipFor, setShowTooltipFor] = useState<string | null>(null);

  const uniqueGenres = useMemo(() => {
    const genres = events.map((e) => e.genre).filter((genre): genre is string => !!genre);
    return Array.from(new Set(genres)).sort();
  }, [events]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((event) => event.name.toLowerCase().includes(searchLower) || event.venue?.toLowerCase().includes(searchLower));
    }

    if (filters.city) {
      filtered = filtered.filter((event) => event.city === filters.city);
    }

    if (filters.genre) {
      filtered = filtered.filter((event) => event.genre === filters.genre);
    }

    if (filters.priceRange !== 'all') {
      filtered = filtered.filter((event) => {
        if (!event.priceRanges || event.priceRanges.length === 0) {
          return filters.priceRange === 'unknown';
        }
        const minPrice = event.priceRanges[0].min;
        switch (filters.priceRange) {
          case 'budget':
            return minPrice < 50;
          case 'moderate':
            return minPrice >= 50 && minPrice < 150;
          case 'premium':
            return minPrice >= 150;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (a.date || '').localeCompare(b.date || '');
        case 'name':
          return a.name.localeCompare(b.name);
        case 'relevance':
        default:
          return a.relevanceFactors.position - b.relevanceFactors.position;
      }
    });

    return filtered;
  }, [events, filters, sortBy]);

  const formatPrice = (event: Event): string => {
    if (!event.priceRanges || event.priceRanges.length === 0) {
      return 'Price TBA';
    }
    const { min, max, currency } = event.priceRanges[0];
    return `${currency} $${min} - $${max}`;
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h1>Found {filteredEvents.length} Events</h1>
        <button className="button button-secondary" onClick={onStartOver}>
          ← Start New Search
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <input type="text" className="filter-input" placeholder="Search events..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />

        <select className="filter-select" value={filters.genre} onChange={(e) => setFilters({ ...filters, genre: e.target.value })}>
          <option value="">All Genres</option>
          {uniqueGenres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>

        <select className="filter-select" value={filters.priceRange} onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}>
          <option value="all">All Prices</option>
          <option value="budget">Budget (&lt;$50)</option>
          <option value="moderate">Moderate ($50-150)</option>
          <option value="premium">Premium ($150+)</option>
          <option value="unknown">Price TBA</option>
        </select>

        <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="relevance">Sort by Relevance</option>
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Results Table */}
      {filteredEvents.length === 0 ? (
        <div className="no-results">
          <h2>No events found matching your filters</h2>
          <p>Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date & Time</th>
                <th>Location</th>
                <th>Genre</th>
                <th>Price Range</th>
                <th>Relevance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td className="event-name">
                    <div className="event-info">
                      {event.image && <img src={event.image} alt={event.name} className="event-image" />}
                      <div>
                        <strong>{event.name}</strong>
                        {event.venue && <div className="venue">{event.venue}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {event.date && (
                      <div>
                        <div>{new Date(event.date).toLocaleDateString()}</div>
                        {event.time && <div className="time">{event.time}</div>}
                      </div>
                    )}
                  </td>
                  <td>
                    {event.city && event.state && (
                      <div>
                        {event.city}, {event.state}
                      </div>
                    )}
                  </td>
                  <td>{event.genre || event.classification || '-'}</td>
                  <td>{formatPrice(event)}</td>
                  <td>
                    <div className="relevance-cell" onMouseEnter={() => setShowTooltipFor(event.id)} onMouseLeave={() => setShowTooltipFor(null)}>
                      <div className="relevance-badge">
                        #{event.relevanceFactors.position}
                        <span className="tooltip-icon">ℹ️</span>
                      </div>
                      {showTooltipFor === event.id && (
                        <div className="relevance-tooltip">
                          <div className="tooltip-header">Relevance Score</div>
                          <div className="tooltip-content">
                            <div className="tooltip-item">
                              <span className="tooltip-label">API Position:</span>
                              <span className="tooltip-value">#{event.relevanceFactors.position}</span>
                            </div>
                            {event.relevanceFactors.hasKeywordMatch !== null && (
                              <div className={`tooltip-item ${event.relevanceFactors.hasKeywordMatch ? 'match' : 'no-match'}`}>
                                <span className="match-icon">{event.relevanceFactors.hasKeywordMatch ? '✓' : '✗'}</span>
                                <span>Keyword match</span>
                              </div>
                            )}
                            {event.relevanceFactors.matchesClassification !== null && (
                              <div className={`tooltip-item ${event.relevanceFactors.matchesClassification ? 'match' : 'no-match'}`}>
                                <span className="match-icon">{event.relevanceFactors.matchesClassification ? '✓' : '✗'}</span>
                                <span>Event type match</span>
                              </div>
                            )}
                            {event.relevanceFactors.matchesCity !== null && (
                              <div className={`tooltip-item ${event.relevanceFactors.matchesCity ? 'match' : 'no-match'}`}>
                                <span className="match-icon">{event.relevanceFactors.matchesCity ? '✓' : '✗'}</span>
                                <span>City match</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <a href={event.url} target="_blank" rel="noopener noreferrer" className="button-link">
                      View Details
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
