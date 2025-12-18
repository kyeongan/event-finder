/**
 * QuestionFlow Component Tests
 *
 * Focus: Resume functionality (key requirement) and basic rendering
 *
 * Note: Comprehensive flow testing is deferred due to conditional question logic
 * that makes tests brittle. The pure function tests (questions.ts, storage.ts)
 * provide good coverage of the underlying logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionFlow } from '../components/QuestionFlow';
import * as storage from '../utils/storage';

vi.mock('../utils/storage');

describe('QuestionFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.saveAnswers).mockImplementation(() => {});
  });

  describe('Initial Render', () => {
    it('renders component successfully', () => {
      vi.mocked(storage.hasSavedAnswers).mockReturnValue(false);

      render(<QuestionFlow onComplete={vi.fn()} />);

      expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
      expect(screen.getByText(/Question/i)).toBeInTheDocument();
    });
  });

  describe('Resume Functionality', () => {
    it('shows resume prompt when saved answers exist', () => {
      vi.mocked(storage.hasSavedAnswers).mockReturnValue(true);
      vi.mocked(storage.loadAnswers).mockReturnValue({ location: 'Boston, MA' });

      render(<QuestionFlow onComplete={vi.fn()} />);

      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      expect(screen.getByText(/Resume Search/i)).toBeInTheDocument();
      expect(screen.getByText(/Start Fresh/i)).toBeInTheDocument();
    });

    it('clears saved data when clicking Start Fresh', () => {
      vi.mocked(storage.hasSavedAnswers).mockReturnValue(true);
      vi.mocked(storage.clearAnswers).mockImplementation(() => {});

      render(<QuestionFlow onComplete={vi.fn()} />);

      fireEvent.click(screen.getByText(/Start Fresh/i));

      expect(storage.clearAnswers).toHaveBeenCalled();
      expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument();
    });

    it('dismisses resume prompt when clicking Resume', () => {
      vi.mocked(storage.hasSavedAnswers).mockReturnValue(true);
      vi.mocked(storage.loadAnswers).mockReturnValue({
        eventType: 'Music',
        location: 'Boston, MA',
      });

      render(<QuestionFlow onComplete={vi.fn()} />);

      fireEvent.click(screen.getByText(/Resume Search/i));

      expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument();
    });
  });

  describe('Progress Indication', () => {
    it('shows progress bar', () => {
      vi.mocked(storage.hasSavedAnswers).mockReturnValue(false);

      render(<QuestionFlow onComplete={vi.fn()} />);

      const progressBar = document.querySelector('.progress-bar');
      expect(progressBar).toBeInTheDocument();
    });
  });
});
