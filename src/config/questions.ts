/**
 * Configurable Question Flow
 *
 * This configuration defines all questions in the event search flow.
 * Questions can be easily added, removed, or modified without changing UI code.
 *
 * Each question supports:
 * - Different input types (select, text, multiselect)
 * - Custom validation
 * - Conditional display based on previous answers
 */

export type QuestionType = 'select' | 'text' | 'multiselect' | 'autocomplete';

export interface QuestionOption {
  value: string;
  label: string;
  emoji?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  placeholder?: string;
  required: boolean;
  options?: QuestionOption[];
  validation?: (value: any) => string | null;
  helpText?: string;
  // Conditional display based on previous answers
  showIf?: (answers: Record<string, any>) => boolean;
}

/**
 * Main questions configuration
 * Modify this array to change the question flow
 */
export const questions: Question[] = [
  {
    id: 'location',
    type: 'autocomplete',
    question: 'Where are you looking for events?',
    placeholder: 'e.g., New York, NY',
    required: false,
    helpText: 'Start typing to see suggestions',
    validation: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Please enter a location';
      }
      if (value.trim().length < 2) {
        return 'Location must be at least 2 characters';
      }
      return null;
    },
  },
  {
    id: 'dateRange',
    type: 'select',
    question: 'When would you like to attend?',
    placeholder: 'Select a timeframe',
    required: false,
    options: [
      { value: 'today', label: 'Today', emoji: '📅' },
      { value: 'this-week', label: 'This Week', emoji: '📆' },
      { value: 'this-weekend', label: 'This Weekend', emoji: '🎉' },
      { value: 'next-week', label: 'Next Week', emoji: '📅' },
      { value: 'this-month', label: 'This Month', emoji: '🗓️' },
      { value: 'next-month', label: 'Next Month', emoji: '📆' },
      { value: 'next-3-months', label: 'Next 3 Months', emoji: '🗓️' },
    ],
    helpText: 'Leave blank to see all upcoming events',
  },
  {
    id: 'eventType',
    type: 'select',
    question: 'What type of event interests you?',
    placeholder: 'Choose an event category',
    required: false,
    options: [
      { value: 'Music', label: 'Music', emoji: '🎵' },
      { value: 'Sports', label: 'Sports', emoji: '⚽' },
      { value: 'Arts', label: 'Arts & Theatre', emoji: '🎭' },
      { value: 'Family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
      { value: 'Film', label: 'Film', emoji: '🎬' },
    ],
    helpText: 'Leave blank to see all event types',
  },
  {
    id: 'musicGenre',
    type: 'select',
    question: 'What music genres do you prefer?',
    placeholder: 'Pick a genre',
    required: false,
    options: [
      { value: 'rock', label: 'Rock', emoji: '🎸' },
      { value: 'pop', label: 'Pop', emoji: '🎤' },
      { value: 'jazz', label: 'Jazz', emoji: '🎷' },
      { value: 'classical', label: 'Classical', emoji: '🎼' },
    ],
    helpText: 'Shown only when you pick Music above',
    showIf: (answers: Record<string, any>) => answers.eventType === 'Music',
  },
  {
    id: 'sportType',
    type: 'select',
    question: 'What sport type do you prefer?',
    placeholder: 'Pick a sport',
    required: false,
    options: [
      { value: 'golf', label: 'Golf', emoji: '⛳' },
      { value: 'tennis', label: 'Tennis', emoji: '🎾' },
      { value: 'football', label: 'Football', emoji: '🏈' },
      { value: 'basketball', label: 'Basketball', emoji: '🏀' },
      { value: 'baseball', label: 'Baseball', emoji: '⚾' },
      { value: 'soccer', label: 'Soccer', emoji: '⚽' },
    ],
    helpText: 'Shown only when you pick Sports above',
    showIf: (answers: Record<string, any>) => answers.eventType === 'Sports',
  },
  {
    id: 'keywords',
    type: 'text',
    question: 'Any specific keywords?',
    placeholder: 'e.g., Taylor, Yankees, Comedy',
    required: false,
    helpText: 'Optional - helps narrow down results',
    validation: (value: string) => {
      if (value && value.length > 100) {
        return 'Keywords must be less than 100 characters';
      }
      return null;
    },
  },
];

/**
 * Get a question by ID
 */
export function getQuestion(id: string): Question | undefined {
  return questions.find((q) => q.id === id);
}

/**
 * Get all visible questions based on current answers
 */
export function getVisibleQuestions(answers: Record<string, any>): Question[] {
  return questions.filter((q) => {
    if (!q.showIf) return true;
    return q.showIf(answers);
  });
}

/**
 * Validate all answers
 */
export function validateAnswers(answers: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};

  const visibleQuestions = getVisibleQuestions(answers);

  for (const question of visibleQuestions) {
    const value = answers[question.id];

    // Check required fields
    if (question.required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
      errors[question.id] = 'This field is required';
      continue;
    }

    // Run custom validation
    if (question.validation && value) {
      const error = question.validation(value);
      if (error) {
        errors[question.id] = error;
      }
    }
  }

  return errors;
}

/**
 * Transform answers to API search parameters
 */
export function answersToSearchParams(answers: Record<string, any>) {
  return {
    location: answers.location || '',
    dateRange: answers.dateRange || '',
    eventType: answers.eventType || '',
    musicGenre: answers.musicGenre || '',
    sportType: answers.sportType || '',
    keywords: answers.keywords || '',
  };
}
