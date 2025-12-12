import React, { useState, useEffect, useRef } from 'react';
import './SearchForm.css';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
}

export interface SearchParams {
  location: string;
  dateRange: string;
  eventType: string;
  keywords?: string;
}

// Top cities for location autocomplete
const SUGGESTED_CITIES = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA',
  'San Antonio, TX',
  'San Diego, CA',
  'Dallas, TX',
  'San Jose, CA',
  'Austin, TX',
  'Jacksonville, FL',
  'Fort Worth, TX',
  'Columbus, OH',
  'San Francisco, CA',
  'Charlotte, NC',
  'Indianapolis, IN',
  'Seattle, WA',
  'Denver, CO',
  'Boston, MA',
  'Nashville, TN',
  'Las Vegas, NV',
  'Portland, OR',
  'Miami, FL',
  'Atlanta, GA',
];
export const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
  const [location, setLocation] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [eventType, setEventType] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter cities based on input
  useEffect(() => {
    if (location.length >= 2) {
      const matches = SUGGESTED_CITIES.filter((city) => city.toLowerCase().includes(location.toLowerCase()));
      setFilteredCities(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [location]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) && !inputRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.trim()) {
      alert('Please enter a location');
      return;
    }

    onSearch({ location, dateRange, eventType });
  };

  const handleCitySelect = (city: string) => {
    setLocation(city);
    setShowSuggestions(false);
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="search-form-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <div className="autocomplete-wrapper">
              <input
                ref={inputRef}
                id="location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onFocus={() => location.length >= 2 && filteredCities.length > 0 && setShowSuggestions(true)}
                placeholder="e.g., New York, NY"
                className="form-input"
                autoComplete="on"
              />
              {showSuggestions && (
                <div ref={suggestionsRef} className="suggestions-dropdown">
                  {filteredCities.map((city) => (
                    <div key={city} className="suggestion-item" onClick={() => handleCitySelect(city)}>
                      📍 {city}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dateRange">Date Range</label>
            <select id="dateRange" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="form-input">
              <option value="">Select timeframe</option>
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-weekend">This Weekend</option>
              <option value="next-week">Next Week</option>
              <option value="this-month">This Month</option>
              <option value="next-month">Next Month</option>
              <option value="next-3-months">Next 3 Months</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="eventType">Type of Event</label>
            <select id="eventType" value={eventType} onChange={(e) => setEventType(e.target.value)} className="form-input">
              <option value="">Select event type</option>
              <option value="Music">🎵 Music</option>
              <option value="Sports">⚽ Sports</option>
              <option value="Arts">🎭 Arts & Theatre</option>
              <option value="Family">👨‍👩‍👧‍👦 Family</option>
              <option value="Film">🎬 Film</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="search">&nbsp;</label>
            <button type="submit" className="search-button">
              Search Events
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
