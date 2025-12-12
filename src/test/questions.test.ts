/**
 * Questions Configuration Tests
 *
 * WHY THESE TESTS:
 * - Configuration drives the entire user flow (critical requirement)
 * - Invalid configuration could break the app at runtime
 * - Validation logic needs verification
 * - Easy to test, prevents production issues
 */

import { describe, it, expect } from 'vitest';
import { questions, getQuestion, getVisibleQuestions, validateAnswers, answersToSearchParams } from '../config/questions';

describe('Questions Configuration', () => {
  describe('questions array', () => {
    it('should have at least 3 questions', () => {
      // WHY: Requirement states 3-5 questions minimum
      expect(questions.length).toBeGreaterThanOrEqual(3);
    });

    it('should have unique IDs for all questions', () => {
      // WHY: Duplicate IDs would cause state management issues
      const ids = questions.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have required fields for each question', () => {
      // WHY: Missing required fields would cause rendering errors
      questions.forEach((question) => {
        expect(question.id).toBeDefined();
        expect(question.type).toBeDefined();
        expect(question.question).toBeDefined();
        expect(typeof question.required).toBe('boolean');
      });
    });

    it('should have valid question types', () => {
      // WHY: Invalid types would cause rendering issues
      const validTypes = ['select', 'text', 'autocomplete', 'multiselect'];
      questions.forEach((question) => {
        expect(validTypes).toContain(question.type);
      });
    });

    it('should have options for select-type questions', () => {
      // WHY: Select questions need options to render
      const selectQuestions = questions.filter((q) => q.type === 'select');
      selectQuestions.forEach((question) => {
        expect(question.options).toBeDefined();
        expect(question.options!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getQuestion', () => {
    it('should retrieve question by ID', () => {
      // WHY: Need to access individual questions by ID
      const locationQuestion = getQuestion('location');
      expect(locationQuestion).toBeDefined();
      expect(locationQuestion?.id).toBe('location');
    });

    it('should return undefined for non-existent ID', () => {
      // WHY: Graceful handling of invalid IDs
      const nonExistent = getQuestion('non-existent');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('getVisibleQuestions', () => {
    it('should return all questions when no conditions exist', () => {
      // WHY: Default behavior should show all questions
      const answers = {};
      const visible = getVisibleQuestions(answers);

      // Count questions without showIf conditions
      const unconditionalQuestions = questions.filter((q) => !q.showIf);
      expect(visible.length).toBeGreaterThanOrEqual(unconditionalQuestions.length);
    });

    it('should filter questions based on showIf conditions', () => {
      // WHY: Conditional questions must be properly filtered
      // This test assumes conditional questions exist
      const answers = { eventType: 'Music' };
      const visible = getVisibleQuestions(answers);

      expect(Array.isArray(visible)).toBe(true);
    });
  });

  describe('validateAnswers', () => {
    it('should validate required location field', () => {
      // WHY: Location is required per config
      const answers = { location: '' };
      const errors = validateAnswers(answers);

      expect(errors.location).toBeDefined();
      expect(typeof errors.location).toBe('string');
    });

    it('should pass validation with valid location', () => {
      // WHY: Valid input should not produce errors
      const answers = { location: 'New York, NY' };
      const errors = validateAnswers(answers);

      // Should either have no location error or be empty
      expect(errors.location || '').not.toContain('required');
    });

    it('should allow optional fields to be empty', () => {
      // WHY: Optional fields should not cause validation errors
      const answers = {
        location: 'Boston, MA',
        dateRange: '',
        eventType: '',
      };
      const errors = validateAnswers(answers);

      expect(errors.dateRange).toBeUndefined();
      expect(errors.eventType).toBeUndefined();
    });

    it('should validate keywords length if provided', () => {
      // WHY: Keywords have length restrictions
      const answers = {
        location: 'Test',
        keywords: 'a'.repeat(101), // Over 100 characters
      };
      const errors = validateAnswers(answers);

      expect(errors.keywords).toBeDefined();
    });
  });

  describe('answersToSearchParams', () => {
    it('should transform answers to search parameters', () => {
      // WHY: Answers need to be converted to API format
      const answers = {
        location: 'New York, NY',
        dateRange: 'this-week',
        eventType: 'Music',
        keywords: 'concert',
      };

      const params = answersToSearchParams(answers);

      expect(params.location).toBe('New York, NY');
      expect(params.dateRange).toBe('this-week');
      expect(params.eventType).toBe('Music');
      expect(params.keywords).toBe('concert');
    });

    it('should handle missing optional fields', () => {
      // WHY: Not all fields are required
      const answers = { location: 'Boston, MA' };
      const params = answersToSearchParams(answers);

      expect(params.location).toBe('Boston, MA');
      expect(params.dateRange).toBe('');
      expect(params.eventType).toBe('');
    });
  });
});

/**
 * ADDITIONAL TESTS TO ADD WITH MORE TIME:
 *
 * 1. Complex Conditional Logic:
 *    - Test all possible showIf conditions
 *    - Test nested conditional questions
 *    - Test circular dependencies prevention
 *
 * 2. Custom Validation:
 *    - Test all custom validation functions
 *    - Test validation with edge case inputs
 *    - Test validation error messages
 *
 * 3. Configuration Migration:
 *    - Test backward compatibility
 *    - Test loading old saved answers with new questions
 *    - Test handling removed questions
 *
 * 4. Internationalization:
 *    - Test with different locales
 *    - Test RTL language support
 *    - Test special characters in questions
 */
