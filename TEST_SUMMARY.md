# Test Suite Summary

## Overview

This test suite focuses on high-value unit tests for the event-finder application, covering the core functionality that ensures the app works reliably. All tests include comments explaining WHY each test was chosen.

## Test Files Created

### 1. `src/test/storage.test.ts` (14 tests)

**Purpose**: Test localStorage persistence utilities that power the "resume search" feature.

**Why These Tests Matter**:

- Data persistence is critical to UX - users expect their progress to be saved
- localStorage can fail (quota exceeded, corrupt data, etc.)
- JSON serialization errors can cause silent failures

**Coverage**: 75.67% of storage.ts

- ✅ Save and load operations
- ✅ Clear functionality
- ✅ Error handling for corrupt data
- ✅ Search history management (limit, order, duplicates)
- ✅ Edge cases (null, undefined, invalid JSON)

### 2. `src/test/questions.test.ts` (15 tests)

**Purpose**: Validate the configurable question system that drives the multi-step form.

**Why These Tests Matter**:

- Configuration errors would break the entire question flow at runtime
- Validation rules must work correctly or bad data reaches the API
- Skip logic determines which questions users see
- Transformation from answers to API params must be accurate

**Coverage**: 85.71% of questions.ts

- ✅ Question structure validation
- ✅ Required field enforcement
- ✅ Skip logic for conditional questions
- ✅ Answer validation (required fields, valid values)
- ✅ Transformation to API search parameters
- ✅ Edge cases (empty arrays, invalid types)

### 3. `src/test/QuestionFlow.test.tsx` (5 tests)

**Purpose**: Simple smoke tests for the core UI component.

**Why These Tests Matter**:

- Verify component renders without crashing
- Test critical validation logic
- Verify resume feature (key requirement) works
- **Kept intentionally simple** - component tests get complex quickly

**Coverage**: 52.23% of QuestionFlow.tsx

- ✅ Component renders and shows first question
- ✅ Progress indicator displays
- ✅ Validation errors appear when appropriate
- ✅ Resume prompt appears with saved data
- ✅ Clear saved data functionality works

**Why Simple UI Tests**:

- Component testing requires extensive mocking and setup
- Pure function tests (questions, storage, relevance) provide high confidence
- These smoke tests verify critical paths work
- For production, E2E tests (Playwright/Cypress) would cover full user flows

### 4. `src/test/relevance.test.ts` (30 tests) ⭐ **Pure Function Tests**

**Purpose**: Test relevance scoring algorithms that determine search result quality.

**Why These Tests Matter**:

- **Pure functions are ideal for testing**: Deterministic, no side effects, no mocks needed
- Scoring logic directly affects what users see
- Algorithm changes can introduce subtle bugs
- Fast tests with high confidence
- Easy to verify correctness with examples

**Coverage**: 100% of backend/src/relevance.ts (all statements, branches, functions, lines)

- ✅ Keyword matching (case-insensitive, partial matches)
- ✅ Classification matching (exact matches, case handling)
- ✅ City matching (bidirectional matching, state codes)
- ✅ Combined relevance factors calculation
- ✅ Scoring algorithm (weights, position penalty, capping)
- ✅ Null vs false distinction (not searched vs not matched)
- ✅ Determinism verification (same input = same output)
- ✅ Edge cases (empty strings, undefined values)

**Why Pure Functions Are Excellent Test Candidates**:

- No I/O operations or external dependencies
- No async complications
- No state management
- No mocking required
- Tests run extremely fast
- Easy to understand and maintain
- High confidence in correctness

## Test Results

```
✓ src/test/questions.test.ts (15 tests)
✓ src/test/storage.test.ts (14 tests)
✓ src/test/QuestionFlow.test.tsx (5 tests - simple smoke tests)
✓ src/test/relevance.test.ts (30 tests)

Test Files  4 passed (4)
Tests       64 passed (64)
Coverage:   66% overall
            100% relevance.ts (pure functions) ⭐
```

## What Was NOT Tested (Given More Time)

### Full Step Navigation

**Why valuable**: Verify multi-step flow works end-to-end.

- Navigate through all questions with valid input
- Test Back button and answer changes
- Test Skip on optional questions
- Mock city selection and API responses

### Integration Tests

**Why valuable**: Test components working together.

- Complete search flow from questions to results
- Test with real API calls (or comprehensive mocks)
- Error handling when APIs fail
- State management across components

### E2E Tests (Playwright/Cypress)

**Why valuable**: Test in real browser with actual user interactions.

- Full user journey from landing to search results
- Keyboard navigation and accessibility
- Mobile viewport testing
- Real network requests

### API Tests

**Why valuable**: Ensure backend correctly handles various inputs.

- Ticketmaster API integration
- City search endpoint
- Relevance factor calculation
- Error handling for API failures

### Accessibility Tests

**Why valuable**: Ensure app is usable by everyone.

- Screen reader compatibility (NVDA, JAWS)
- Keyboard-only navigation
- ARIA labels and roles
- Focus indicators and management

## Test Philosophy

These tests were chosen based on:

1. **Risk**: What would cause the worst user experience if broken?

   - Data loss (storage tests)
   - Invalid configuration (questions tests)
   - Broken navigation (QuestionFlow tests)

2. **Value**: What provides the most confidence in the code?

   - Core business logic
   - Data transformation
   - Error handling

3. **Maintainability**: What tests will catch regressions?

   - Configuration validation
   - API parameter transformation
   - State management

4. **Time Efficiency**: What can be tested quickly and reliably?
   - Pure functions (questions config)
   - Isolated utilities (storage)
   - Component structure (QuestionFlow initial state)

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in UI mode
npm run test:ui
```

## Notes

- All tests include "WHY" comments explaining their value
- Tests focus on behavior, not implementation details
- Mocks are used only where necessary (storage, fetch)
- Error cases are tested alongside happy paths
- Each test file includes detailed "would add with more time" sections
