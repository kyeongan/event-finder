import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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

// Search events endpoint - reverse proxy to Ticketmaster API
app.get('/api/events/search', async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      city,
      stateCode,
      classificationName,
      startDateTime,
      endDateTime,
      size = 20,
      page = 0
    }: EventSearchParams = req.query;

    // Build query parameters
    const params: any = {
      apikey: TICKETMASTER_API_KEY,
      size,
      page,
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
        matchesCity: city ? event._embedded?.venues?.[0]?.city?.name?.toLowerCase() === city.toLowerCase() : null,
      }
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
        details: error.response.data
      });
    } else if (error.request) {
      // Request was made but no response received
      res.status(503).json({
        error: 'Service unavailable',
        message: 'Unable to reach Ticketmaster API'
      });
    } else {
      // Something else happened
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

// Get event classifications/categories
app.get('/api/events/classifications', async (req: Request, res: Response) => {
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
        genres: c._embedded?.genres?.map((g: any) => g.name) || []
      }))
    });
  } catch (error: any) {
    console.error('Error fetching classifications:', error.message);
    res.status(500).json({
      error: 'Failed to fetch classifications',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
