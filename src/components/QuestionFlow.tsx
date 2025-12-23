import React, { useState, useEffect, useRef } from 'react';
import { getVisibleQuestions, validateAnswers, answersToSearchParams } from '../config/questions';
import { saveAnswers, loadAnswers, clearAnswers, hasSavedAnswers } from '../utils/storage';
import './QuestionFlow.css';

interface QuestionFlowProps {
  onComplete: (answers: Record<string, any>) => void;
  initialAnswers?: Record<string, any>;
}

interface City {
  name: string;
  state: string;
  stateCode: string;
  displayName: string;
}

export const QuestionFlow: React.FC<QuestionFlowProps> = ({ onComplete, initialAnswers = {} }) => {
  // Load saved answers or use initial answers
  const savedAnswers = loadAnswers();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(savedAnswers || initialAnswers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(hasSavedAnswers() && Object.keys(initialAnswers).length === 0);
  const [validatedCities, setValidatedCities] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const cityJustSelected = useRef(false);

  const visibleQuestions = getVisibleQuestions(answers);
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;
  const currentValue = answers[currentQuestion?.id] || '';

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveAnswers(answers);
    }
  }, [answers]);

  // Fetch city suggestions for autocomplete
  useEffect(() => {
    if (currentQuestion?.type !== 'autocomplete') return;

    // Don't fetch if we just selected a city
    if (cityJustSelected.current) {
      cityJustSelected.current = false;
      return;
    }

    const value = currentValue as string;
    if (!value || value.length < 2) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchCities = async () => {
      setIsLoadingSuggestions(true);
      try {
        // Using POST to send query in request body instead of URL parameters
        // Pros: More secure, no URL length limits, better for complex queries
        // Cons: Cannot cache as effectively, not bookmarkable
        const response = await fetch(`http://localhost:3001/api/cities/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: value,
            limit: 10,
          }),
        });
        const data = await response.json();
        setCitySuggestions(data.cities || []);
        setShowSuggestions(data.cities?.length > 0);
      } catch (error) {
        console.error('Error fetching cities:', error);
        setCitySuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchCities, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [currentValue, currentQuestion?.type]);

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

  const handleAnswer = (value: any) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    setErrors({ ...errors, [currentQuestion.id]: '' });

    // If user manually types in location field, remove from validated set
    if (currentQuestion.id === 'location' && currentQuestion.type === 'autocomplete') {
      const newValidated = new Set(validatedCities);
      newValidated.delete('location');
      setValidatedCities(newValidated);
    }
  };

  const handleNext = () => {
    // Special validation for autocomplete location field
    if (currentQuestion.id === 'location' && currentQuestion.type === 'autocomplete') {
      if (!validatedCities.has('location')) {
        setErrors({ ...errors, location: 'Please select a city from the suggestions' });
        return;
      }
    }

    // Validate current answer
    const validationErrors = validateAnswers({ [currentQuestion.id]: currentValue });

    if (validationErrors[currentQuestion.id]) {
      setErrors({ ...errors, [currentQuestion.id]: validationErrors[currentQuestion.id] });
      return;
    }

    if (isLastQuestion) {
      // Final validation
      const allErrors = validateAnswers(answers);
      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        return;
      }

      // Convert answers to search params and complete
      const searchParams = answersToSearchParams(answers);
      clearAnswers(); // Clear saved answers after successful search
      onComplete(searchParams);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSkip = () => {
    if (!currentQuestion.required) {
      if (isLastQuestion) {
        const searchParams = answersToSearchParams(answers);
        clearAnswers(); // Clear saved answers after successful search
        onComplete(searchParams);
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  const handleCitySelect = (city: City) => {
    cityJustSelected.current = true;
    const newAnswers = { ...answers, location: city.displayName };
    setAnswers(newAnswers);
    setErrors({ ...errors, location: '' });
    setShowSuggestions(false);
    // Mark this city as validated (selected from suggestions)
    setValidatedCities(new Set(validatedCities).add('location'));
    // Clear suggestions list to prevent reopening
    setCitySuggestions([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleStartFresh = () => {
    clearAnswers();
    setAnswers({});
    setShowResumePrompt(false);
    setCurrentQuestionIndex(0);
  };

  const handleResume = () => {
    setShowResumePrompt(false);
    // Find the first unanswered question
    const firstUnanswered = visibleQuestions.findIndex((q) => !answers[q.id]);
    if (firstUnanswered !== -1) {
      setCurrentQuestionIndex(firstUnanswered);
    }
  };

  if (showResumePrompt) {
    return (
      <div className="question-flow">
        <div className="resume-prompt">
          <div className="resume-icon">💾</div>
          <h2>Welcome back!</h2>
          <p>We found your previous search progress. Would you like to continue where you left off?</p>
          <div className="resume-actions">
            <button type="button" className="btn-primary" onClick={handleResume}>
              Resume Search
            </button>
            <button type="button" className="btn-secondary" onClick={handleStartFresh}>
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  const renderInput = () => {
    switch (currentQuestion.type) {
      case 'autocomplete':
        return (
          <div className="autocomplete-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={currentValue}
              onChange={(e) => handleAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => currentValue.length >= 2 && citySuggestions.length > 0 && setShowSuggestions(true)}
              placeholder={currentQuestion.placeholder}
              className={`question-input ${errors[currentQuestion.id] ? 'error' : ''}`}
              autoFocus
            />
            {showSuggestions && citySuggestions.length > 0 && (
              <div ref={suggestionsRef} className="suggestions-dropdown">
                {citySuggestions.map((city) => (
                  <div key={`${city.name}-${city.stateCode}`} className="suggestion-item" onClick={() => handleCitySelect(city)}>
                    📍 {city.displayName}
                  </div>
                ))}
              </div>
            )}
            {isLoadingSuggestions && <div className="loading-suggestions">Loading...</div>}
          </div>
        );

      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentQuestion.placeholder}
            className={`question-input ${errors[currentQuestion.id] ? 'error' : ''}`}
            autoFocus
          />
        );

      case 'select':
        return (
          <div className="options-grid">
            {currentQuestion.options?.map((option) => (
              <button key={option.value} type="button" className={`option-button ${currentValue === option.value ? 'selected' : ''}`} onClick={() => handleAnswer(option.value)}>
                {option.emoji && <span className="option-emoji">{option.emoji}</span>}
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>
        );

      case 'multiselect': {
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        return (
          <div className="options-grid">
            {currentQuestion.options?.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`option-button ${selectedValues.includes(option.value) ? 'selected' : ''}`}
                onClick={() => {
                  const newValues = selectedValues.includes(option.value) ? selectedValues.filter((v) => v !== option.value) : [...selectedValues, option.value];
                  handleAnswer(newValues);
                }}
              >
                {option.emoji && <span className="option-emoji">{option.emoji}</span>}
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>
        );
      }
    }
  };

  return (
    <div className="question-flow">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((currentQuestionIndex + 1) / visibleQuestions.length) * 100}%` }} />
      </div>

      <div className="question-container">
        <div className="question-header">
          <span className="question-number">
            Question {currentQuestionIndex + 1} of {visibleQuestions.length}
          </span>
          <h2 className="question-text">{currentQuestion.question}</h2>
          {currentQuestion.helpText && <p className="question-help">{currentQuestion.helpText}</p>}
        </div>

        <div className="question-input-container">
          {renderInput()}
          {errors[currentQuestion.id] && <div className="error-message">{errors[currentQuestion.id]}</div>}
        </div>

        <div className="question-actions">
          <div className="action-left">
            {currentQuestionIndex > 0 && (
              <button type="button" className="btn-secondary" onClick={handleBack}>
                ← Back
              </button>
            )}
          </div>
          <div className="action-right">
            {!currentQuestion.required && (
              <button type="button" className="btn-link" onClick={handleSkip}>
                Skip
              </button>
            )}
            <button type="button" className="btn-primary" onClick={handleNext}>
              {isLastQuestion ? 'Search Events' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      <div className="question-indicators">
        {visibleQuestions.map((q, index) => (
          <div key={q.id} className={`indicator ${index === currentQuestionIndex ? 'active' : ''} ${answers[q.id] ? 'completed' : ''}`} />
        ))}
      </div>
    </div>
  );
};
