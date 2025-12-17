// Question types for the configurable question flow
export type QuestionType = 'text' | 'select' | 'multiselect' | 'date' | 'dateRange';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  placeholder?: string;
  options?: QuestionOption[];
  required?: boolean;
  validation?: (value: any) => string | null; // Returns error message or null
}

export interface QuestionConfig {
  questions: Question[];
}

export interface UserAnswers {
  [questionId: string]: any;
}

// Event types from Ticketmaster API
export interface Event {
  id: string;
  name: string;
  url: string;
  image?: string;
  date?: string;
  time?: string;
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  classification?: string;
  genre?: string;
  subGenre?: string;
  status?: string;
  relevanceFactors: {
    position: number;
    hasKeywordMatch: boolean | null;
    matchesClassification: boolean | null;
    matchesCity: boolean | null;
  };
}

export interface EventSearchResponse {
  events: Event[];
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
  totalEvents: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: any;
}
