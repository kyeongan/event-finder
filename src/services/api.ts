import axios from 'axios';
import { EventSearchResponse } from '../types';
import { SearchParams } from '../components/SearchForm';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Convert date range selection to start/end dates
 */
const getDateRange = (rangeType: string): { start: string; end: string } | null => {
  const now = new Date();
  const start = new Date(now);
  let end = new Date(now);

  switch (rangeType) {
    case 'today':
      // Today only
      break;
    case 'this-week':
      // Rest of this week (until Sunday)
      end.setDate(now.getDate() + (7 - now.getDay()));
      break;
    case 'this-weekend':
      // Saturday and Sunday of this week
      const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
      start.setDate(now.getDate() + daysUntilSaturday);
      end.setDate(start.getDate() + 1);
      break;
    case 'next-week':
      // Next Monday through Sunday
      const daysUntilNextMonday = (1 - now.getDay() + 7) % 7 || 7;
      start.setDate(now.getDate() + daysUntilNextMonday);
      end.setDate(start.getDate() + 6);
      break;
    case 'this-month':
      // Rest of this month
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'next-month':
      // All of next month
      start.setMonth(now.getMonth() + 1, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      break;
    case 'next-3-months':
      // Next 3 months
      end.setMonth(now.getMonth() + 3);
      break;
    default:
      return null;
  }

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
};

/**
 * API service for communicating with the backend
 *
 * This layer abstracts all API calls and provides a clean interface
 * for the React components to interact with the backend.
 * 
 * POST vs GET for search endpoints:
 * 
 * Pros of POST:
 * - Request body supports complex search parameters without URL length limits
 * - More secure - parameters not visible in browser history or server logs
 * - Better for future expansion with nested/complex filter objects
 * - Avoids URL encoding issues with special characters
 * 
 * Cons of POST:
 * - Search results cannot be bookmarked or shared via URL
 * - No browser caching (users must re-fetch on back button)
 * - Cannot use browser prefetching for faster perceived performance
 * - Less RESTful (GET is the semantic HTTP method for queries)
 * 
 * Trade-off: POST provides better security and flexibility at the cost of
 * caching and shareability. For production, consider GET with proper caching
 * headers, or implement both methods for different use cases.
 */

export const eventApi = {
  /**
   * Search for events based on user search parameters
   */
  searchEvents: async (searchParams: SearchParams): Promise<EventSearchResponse> => {
    try {
      const params: any = {};

      // Map search params to API parameters
      if (searchParams.eventType) {
        params.classificationName = searchParams.eventType;
      }

      if (searchParams.location) {
        // Extract city name from "City, State" format
        const cityName = searchParams.location.split(',')[0].trim();
        params.city = cityName;
      }

      if (searchParams.keywords) {
        params.keyword = searchParams.keywords;
      }

      if (searchParams.dateRange) {
        const dateRange = getDateRange(searchParams.dateRange);
        if (dateRange) {
          params.startDateTime = `${dateRange.start}T00:00:00Z`;
          params.endDateTime = `${dateRange.end}T23:59:59Z`;
        }
      }

      console.log('Searching events with params:', params);

      // Using POST instead of GET to send search parameters in request body
      const response = await axios.post<EventSearchResponse>(`${API_BASE_URL}/events/search`, params);

      return response.data;
    } catch (error: any) {
      console.error('Error searching events:', error);

      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to search events');
      }

      if (error.request) {
        throw new Error('Could not reach the server. Please check your internet connection and try again.');
      }

      throw new Error('Something went wrong. Please try again later.');
    }
  },

  /**
   * Health check endpoint to verify backend is running
   */
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      throw new Error('Backend server is not responding');
    }
  },
};
