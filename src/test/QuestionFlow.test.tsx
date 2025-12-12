/**
 * QuestionFlow Component - Simple Smoke Tests
 *
 * WHY: Component testing gets complex fast. These 3 tests verify:
 * 1. Component renders
 * 2. Validation works
 * 3. Resume feature works (key requirement)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionFlow } from '../components/QuestionFlow';
import * as storage from '../utils/storage';

vi.mock('../utils/storage');

describe('QuestionFlow', () => {
  it('renders and shows validation on empty submit', () => {
    vi.mocked(storage.hasSavedAnswers).mockReturnValue(false);

    render(<QuestionFlow onComplete={vi.fn()} />);

    expect(screen.getByText(/Where are you looking for events/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Next/i));
    expect(screen.getByText(/Please select a city/i)).toBeInTheDocument();
  });

  it('shows resume prompt when saved answers exist', () => {
    vi.mocked(storage.hasSavedAnswers).mockReturnValue(true);
    vi.mocked(storage.loadAnswers).mockReturnValue({ location: 'Boston, MA' });

    render(<QuestionFlow onComplete={vi.fn()} />);

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  it('clears saved data when clicking Start Fresh', () => {
    vi.mocked(storage.hasSavedAnswers).mockReturnValue(true);
    vi.mocked(storage.clearAnswers).mockImplementation(() => {});

    render(<QuestionFlow onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText(/Start Fresh/i));
    expect(storage.clearAnswers).toHaveBeenCalled();
  });
});

/**
 * ADDITIONAL TESTS TO ADD WITH MORE TIME:
 *
 * Component tests can get complex fast, so we kept these simple.
 * With more time, these scenarios would be valuable:
 *
 * 1. Full Step Navigation:
 *    - Mock city selection and test advancing to question 2
 *    - Test Back button functionality
 *    - Test completing all questions and calling onComplete
 *
 * 2. Integration Tests:
 *    - Test complete user journey from start to finish
 *    - Test with real city autocomplete API (or mock fetch)
 *    - Test error handling when API fails
 *
 * 3. E2E Tests (Playwright/Cypress):
 *    - Real browser testing with actual interactions
 *    - Test keyboard navigation and accessibility
 *    - Test on mobile viewport sizes
 *
 * WHY WE KEPT IT SIMPLE:
 * - Component tests require lots of setup and mocking
 * - The pure function tests (questions.ts, storage.ts, relevance.ts) give us high confidence
 * - These UI smoke tests verify the component renders and key features work
 * - For production, we'd add E2E tests for full user flows
 */
