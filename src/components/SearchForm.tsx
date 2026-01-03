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

  // ZIP lookup state
  const [isResolvingZip, setIsResolvingZip] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  // Current location state
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

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

  // Auto-resolve US ZIP code -> "City, ST"
  useEffect(() => {
    const zipMatch = location.trim().match(/^(\d{5})(?:-\d{4})?$/);
    if (!zipMatch) {
      setIsResolvingZip(false);
      setZipError(null);
      return;
    }

    const zip5 = zipMatch[1];
    const controller = new AbortController();

    setIsResolvingZip(true);
    setZipError(null);

    const timeoutId = window.setTimeout(async () => {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${zip5}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`ZIP lookup failed: ${res.status}`);

        const data: {
          places?: Array<{
            'place name'?: string;
            'state abbreviation'?: string;
          }>;
        } = await res.json();

        const first = data.places?.[0];
        const city = first?.['place name'];
        const state = first?.['state abbreviation'];

        if (city && state) {
          setLocation(`${city}, ${state}`);
          setShowSuggestions(false);
        } else {
          setZipError('Could not resolve ZIP code.');
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setZipError('Could not resolve ZIP code.');
      } finally {
        setIsResolvingZip(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [location]);

  const handleUseCurrentLocation = () => {
    setLocError(null);
    setZipError(null);
    setShowSuggestions(false);

    if (!('geolocation' in navigator)) {
      setLocError('Geolocation is not supported in this browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          // Reverse geocode -> city/state (no API key)
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`);

          if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);

          const data: {
            city?: string;
            locality?: string;
            principalSubdivision?: string;
            principalSubdivisionCode?: string; // e.g. "US-CA"
            countryCode?: string;
          } = await res.json();

          const city = data.city || data.locality;
          const regionCode = data.principalSubdivisionCode?.includes('-') ? data.principalSubdivisionCode.split('-')[1] : undefined;
          const region = regionCode || data.principalSubdivision;

          if (city && region) {
            setLocation(`${city}, ${region}`);
            setShowSuggestions(false);
            inputRef.current?.blur();
          } else if (data.principalSubdivision && data.countryCode) {
            setLocation(`${data.principalSubdivision}, ${data.countryCode}`);
            setShowSuggestions(false);
            inputRef.current?.blur();
          } else {
            setLocError('Could not determine a city from your location.');
          }
        } catch {
          setLocError('Could not determine a city from your location.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        // Common: user denied permission
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) setLocError('Location permission was denied.');
        else setLocError('Unable to get your current location.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  };

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
    onSearch({ location, dateRange, eventType });
  };

  const handleCitySelect = (city: string) => {
    setLocation(city);
    setShowSuggestions(false);
  };

  return (
    <div className="search-form-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>Location</span>
              <button type="button" onClick={handleUseCurrentLocation} disabled={isLocating} className="search-button" style={{ padding: '6px 10px', fontSize: 12 }}>
                {isLocating ? 'Locating…' : 'Use my location'}
              </button>
            </label>

            <div className="autocomplete-wrapper">
              <input
                ref={inputRef}
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onFocus={() => location.length >= 2 && filteredCities.length > 0 && setShowSuggestions(true)}
                placeholder="ZIP, or use my location"
                className="form-input"
                autoComplete="off"
              />

              {isResolvingZip && <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>Resolving ZIP code…</div>}
              {zipError && <div style={{ marginTop: 6, fontSize: 12, color: '#b00020' }}>{zipError}</div>}

              {locError && <div style={{ marginTop: 6, fontSize: 12, color: '#b00020' }}>{locError}</div>}

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
