/**
 * Express Backend Server
 *
 * PROTOTYPE SHORTCUTS TAKEN:
 * 1. No authentication - endpoints are open to anyone
 * 2. No rate limiting - could be abused in production
 * 3. No caching - every request hits Ticketmaster API
 * 4. In-memory city list - would use database or geocoding API
 * 5. Basic error handling - would add structured logging
 *
 * PRODUCTION IMPROVEMENTS:
 * - Add Redis for API response caching
 * - Implement rate limiting (express-rate-limit)
 * - Add request logging (Morgan or Winston)
 * - Use proper secrets management (AWS Secrets Manager)
 * - Add API versioning (/api/v1/...)
 * - Implement request validation middleware
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // SHORTCUT: Allow all origins. Production: configure specific origins
app.use(express.json());

// Ticketmaster API configuration
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || 'YOUR_API_KEY_HERE';
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

interface EventSearchParams {
  keyword?: string;
  city?: string;
  stateCode?: string;
  classificationName?: string;
  startDateTime?: string;
  endDateTime?: string;
  size?: number;
  page?: number;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Search events endpoint - reverse proxy to Ticketmaster API
 * 
 * POST vs GET pros/cons:
 * 
 * Pros of POST:
 * - Request body allows for larger/complex data structures without URL length limits (2048 chars in most browsers)
 * - More secure - request body not visible in browser history, server logs, or URL bar
 * - Better for sensitive data (though this endpoint doesn't have sensitive data currently)
 * - Prevents caching issues when parameters change frequently
 * - Cleaner for endpoints with many optional parameters
 * 
 * Cons of POST:
 * - Not cacheable by default (GET requests can be cached by browsers/CDNs)
 * - Not bookmarkable or shareable via URL
 * - Cannot be prefetched or preloaded by browsers
 * - Slightly more complex to test (can't just paste URL in browser)
 * - POST is semantically meant for operations that modify state, not queries
 * 
 * Trade-off: For a search endpoint, GET is typically more appropriate, but POST works
 * if you need the benefits above (security, URL length, complex data).
 */
app.post('/api/events/search', async (req: Request, res: Response) => {
  try {
    const { keyword, city, stateCode, classificationName, startDateTime, endDateTime, size = 20, page = 0 }: EventSearchParams = req.body;

    // Validate and coerce input types with bounds checking
    let validatedSize = typeof size === 'number' ? size : parseInt(String(size), 10);
    let validatedPage = typeof page === 'number' ? page : parseInt(String(page), 10);
    
    // Handle invalid numbers and apply bounds
    if (isNaN(validatedSize) || validatedSize < 1 || validatedSize > 100) {
      validatedSize = 20; // Default to 20 if invalid
    }
    if (isNaN(validatedPage) || validatedPage < 0) {
      validatedPage = 0; // Default to 0 if invalid
    }

    // Build query parameters
    const params: any = {
      apikey: TICKETMASTER_API_KEY,
      size: validatedSize,
      page: validatedPage,
    };

    if (keyword) params.keyword = keyword;
    if (city) params.city = city;
    if (stateCode) params.stateCode = stateCode;
    if (classificationName) params.classificationName = classificationName;
    if (startDateTime) params.startDateTime = startDateTime;
    if (endDateTime) params.endDateTime = endDateTime;

    console.log('Searching events with params:', { ...params, apikey: '[REDACTED]' });

    const response = await axios.get(`${TICKETMASTER_BASE_URL}/events.json`, {
      params,
      timeout: 10000,
    });

    // Transform the response to include relevance scoring
    const events = response.data._embedded?.events || [];
    const transformedEvents = events.map((event: any, index: number) => ({
      id: event.id,
      name: event.name,
      url: event.url,
      image: event.images?.[0]?.url,
      date: event.dates?.start?.localDate,
      time: event.dates?.start?.localTime,
      venue: event._embedded?.venues?.[0]?.name,
      city: event._embedded?.venues?.[0]?.city?.name,
      state: event._embedded?.venues?.[0]?.state?.stateCode,
      country: event._embedded?.venues?.[0]?.country?.countryCode,
      classification: event.classifications?.[0]?.segment?.name,
      genre: event.classifications?.[0]?.genre?.name,
      subGenre: event.classifications?.[0]?.subGenre?.name,
      priceRanges: event.priceRanges,
      status: event.dates?.status?.code,
      // Relevance factors for transparency
      relevanceFactors: {
        position: index + 1,
        hasKeywordMatch: keyword ? event.name.toLowerCase().includes(keyword.toLowerCase()) : null,
        matchesClassification: classificationName ? event.classifications?.[0]?.segment?.name?.toLowerCase() === classificationName.toLowerCase() : null,
        matchesCity: city
          ? event._embedded?.venues?.[0]?.city?.name?.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(event._embedded?.venues?.[0]?.city?.name?.toLowerCase() || '')
          : null,
      },
    }));

    res.json({
      events: transformedEvents,
      page: response.data.page,
      totalEvents: response.data.page?.totalElements || 0,
    });
  } catch (error: any) {
    console.error('Error searching events:', error.message);

    if (error.response) {
      // API returned an error response
      res.status(error.response.status).json({
        error: 'Failed to fetch events from Ticketmaster',
        message: error.response.data?.fault?.faultstring || error.message,
        details: error.response.data,
      });
    } else if (error.request) {
      // Request was made but no response received
      res.status(503).json({
        error: 'Service unavailable',
        message: 'Unable to reach Ticketmaster API',
      });
    } else {
      // Something else happened
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
});

/**
 * City autocomplete endpoint
 * 
 * POST vs GET pros/cons:
 * 
 * Pros of POST:
 * - Consistent API design if all endpoints use POST
 * - Request body allows for future expansion with complex filters
 * 
 * Cons of POST:
 * - Autocomplete typically benefits from GET caching for repeated queries
 * - Less efficient for simple string queries
 * - More overhead for frequent, rapid requests (typing events)
 * 
 * Note: For autocomplete, GET is generally preferred due to caching benefits,
 * but using POST for consistency across the API.
 */
app.post('/api/cities/search', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.body;

    // Validate input types
    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.json({ cities: [] });
    }

    // Validate input types with bounds checking
    let validatedLimit = typeof limit === 'number' ? limit : parseInt(String(limit), 10);
    
    // Handle invalid numbers and apply bounds (limit to 1-20 range)
    if (isNaN(validatedLimit) || validatedLimit < 1) {
      validatedLimit = 10; // Default to 10 if invalid
    }
    validatedLimit = Math.min(validatedLimit, 20); // Cap at 20 to prevent performance issues

    // Simple in-memory city data (could be replaced with a database or geocoding API)
    const cities = [
      { name: 'New York', state: 'New York', stateCode: 'NY', displayName: 'New York, NY' },
      { name: 'Los Angeles', state: 'California', stateCode: 'CA', displayName: 'Los Angeles, CA' },
      { name: 'Chicago', state: 'Illinois', stateCode: 'IL', displayName: 'Chicago, IL' },
      { name: 'Houston', state: 'Texas', stateCode: 'TX', displayName: 'Houston, TX' },
      { name: 'Phoenix', state: 'Arizona', stateCode: 'AZ', displayName: 'Phoenix, AZ' },
      { name: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', displayName: 'Philadelphia, PA' },
      { name: 'San Antonio', state: 'Texas', stateCode: 'TX', displayName: 'San Antonio, TX' },
      { name: 'San Diego', state: 'California', stateCode: 'CA', displayName: 'San Diego, CA' },
      { name: 'Dallas', state: 'Texas', stateCode: 'TX', displayName: 'Dallas, TX' },
      { name: 'San Jose', state: 'California', stateCode: 'CA', displayName: 'San Jose, CA' },
      { name: 'Austin', state: 'Texas', stateCode: 'TX', displayName: 'Austin, TX' },
      { name: 'Jacksonville', state: 'Florida', stateCode: 'FL', displayName: 'Jacksonville, FL' },
      { name: 'Fort Worth', state: 'Texas', stateCode: 'TX', displayName: 'Fort Worth, TX' },
      { name: 'Columbus', state: 'Ohio', stateCode: 'OH', displayName: 'Columbus, OH' },
      { name: 'San Francisco', state: 'California', stateCode: 'CA', displayName: 'San Francisco, CA' },
      { name: 'Charlotte', state: 'North Carolina', stateCode: 'NC', displayName: 'Charlotte, NC' },
      { name: 'Indianapolis', state: 'Indiana', stateCode: 'IN', displayName: 'Indianapolis, IN' },
      { name: 'Seattle', state: 'Washington', stateCode: 'WA', displayName: 'Seattle, WA' },
      { name: 'Denver', state: 'Colorado', stateCode: 'CO', displayName: 'Denver, CO' },
      { name: 'Boston', state: 'Massachusetts', stateCode: 'MA', displayName: 'Boston, MA' },
      { name: 'Nashville', state: 'Tennessee', stateCode: 'TN', displayName: 'Nashville, TN' },
      { name: 'Las Vegas', state: 'Nevada', stateCode: 'NV', displayName: 'Las Vegas, NV' },
      { name: 'Portland', state: 'Oregon', stateCode: 'OR', displayName: 'Portland, OR' },
      { name: 'Miami', state: 'Florida', stateCode: 'FL', displayName: 'Miami, FL' },
      { name: 'Atlanta', state: 'Georgia', stateCode: 'GA', displayName: 'Atlanta, GA' },
      { name: 'Washington', state: 'District of Columbia', stateCode: 'DC', displayName: 'Washington, DC' },
      { name: 'New Orleans', state: 'Louisiana', stateCode: 'LA', displayName: 'New Orleans, LA' },
      { name: 'Orlando', state: 'Florida', stateCode: 'FL', displayName: 'Orlando, FL' },
      { name: 'Tampa', state: 'Florida', stateCode: 'FL', displayName: 'Tampa, FL' },
      { name: 'Minneapolis', state: 'Minnesota', stateCode: 'MN', displayName: 'Minneapolis, MN' },
      { name: 'Detroit', state: 'Michigan', stateCode: 'MI', displayName: 'Detroit, MI' },
      { name: 'Salt Lake City', state: 'Utah', stateCode: 'UT', displayName: 'Salt Lake City, UT' },
      { name: 'Raleigh', state: 'North Carolina', stateCode: 'NC', displayName: 'Raleigh, NC' },
      { name: 'Baltimore', state: 'Maryland', stateCode: 'MD', displayName: 'Baltimore, MD' },
      { name: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI', displayName: 'Milwaukee, WI' },
      { name: 'Kansas City', state: 'Missouri', stateCode: 'MO', displayName: 'Kansas City, MO' },
      { name: 'Sacramento', state: 'California', stateCode: 'CA', displayName: 'Sacramento, CA' },
      { name: 'Pittsburgh', state: 'Pennsylvania', stateCode: 'PA', displayName: 'Pittsburgh, PA' },
    ];

    const lowerQuery = query.toLowerCase();
    const maxResults = validatedLimit;

    const matchingCities = cities
      .filter(
        (city) =>
          city.name.toLowerCase().includes(lowerQuery) ||
          city.state.toLowerCase().includes(lowerQuery) ||
          city.stateCode.toLowerCase().includes(lowerQuery) ||
          city.displayName.toLowerCase().includes(lowerQuery)
      )
      .slice(0, maxResults);

    res.json({ cities: matchingCities });
  } catch (error: any) {
    console.error('Error searching cities:', error.message);
    res.status(500).json({
      error: 'Failed to search cities',
      message: error.message,
    });
  }
});

/**
 * Get event classifications/categories
 * 
 * POST vs GET pros/cons:
 * 
 * Pros of POST:
 * - Consistent API design across all endpoints
 * 
 * Cons of POST:
 * - This is a pure read operation that should ideally be cached
 * - GET is more semantically correct for retrieving static data
 * - POST prevents browser/CDN caching, requiring more API calls
 * - Classifications rarely change, so cache hits would significantly reduce load
 * 
 * Note: For static reference data like classifications, GET is strongly preferred.
 * Using POST here only for consistency with the requirement.
 */
app.post('/api/events/classifications', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${TICKETMASTER_BASE_URL}/classifications.json`, {
      params: {
        apikey: TICKETMASTER_API_KEY,
      },
      timeout: 10000,
    });

    const classifications = response.data._embedded?.classifications || [];

    res.json({
      classifications: classifications.map((c: any) => ({
        id: c.id,
        name: c.segment?.name,
        genres: c._embedded?.genres?.map((g: any) => g.name) || [],
      })),
    });
  } catch (error: any) {
    console.error('Error fetching classifications:', error.message);
    res.status(500).json({
      error: 'Failed to fetch classifications',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
