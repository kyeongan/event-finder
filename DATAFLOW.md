# Data Flow Documentation

Complete execution flow for user interactions in the Event Finder app.

---

## Flow 1: User Types City Name

### Step-by-Step Execution

**1. User types "New" in city field**

📂 `QuestionFlow.tsx` **Line 230**

```tsx
<input
  value={currentValue}
  onChange={(e) => handleAnswer(e.target.value)}  // ← FIRES HERE
  ...
/>
```

**2. `handleAnswer()` function executes**

📂 `QuestionFlow.tsx` **Line 96**

```tsx
const handleAnswer = (value: any) => {
  const newAnswers = { ...answers, [currentQuestion.id]: value };
  setAnswers(newAnswers); // ← State updates with "New"
  setErrors({ ...errors, [currentQuestion.id]: '' }); // Clear errors

  // Remove from validated cities set
  const newValidated = new Set(validatedCities);
  newValidated.delete('location');
  setValidatedCities(newValidated); // ← Mark as unvalidated
};
```

**3. React re-renders component**

📂 `QuestionFlow.tsx` **Line 39**

```tsx
const currentValue = answers[currentQuestion?.id] || ''; // ← Now "New"
```

**4. useEffect triggers (dependency changed)**

📂 `QuestionFlow.tsx` **Line 47** - useEffect dependency: `[currentValue, currentQuestion?.type]`

```tsx
useEffect(() => {
  if (currentQuestion?.type !== 'autocomplete') return;

  // Skip if just selected from dropdown
  if (cityJustSelected.current) {
    cityJustSelected.current = false;
    return;
  }

  const value = currentValue as string; // ← "New"

  // Check minimum length
  if (!value || value.length < 2) {
    // ← "New" has 3 chars, continues
    setCitySuggestions([]);
    setShowSuggestions(false);
    return;
  }

  // Async function defined
  const fetchCities = async () => {
    setIsLoadingSuggestions(true); // ← Show loading
    try {
      // API call to backend
      const response = await fetch(`http://localhost:3001/api/cities/search?query=${encodeURIComponent(value)}&limit=10`);
      const data = await response.json();
      setCitySuggestions(data.cities || []); // ← Update suggestions
      setShowSuggestions(data.cities?.length > 0);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCitySuggestions([]);
    } finally {
      setIsLoadingSuggestions(false); // ← Hide loading
    }
  };

  // Debounce: Wait 300ms before fetching
  const timeoutId = setTimeout(fetchCities, 300); // ← Timer starts

  // Cleanup function
  return () => clearTimeout(timeoutId); // ← Cancels previous timer if user keeps typing
}, [currentValue, currentQuestion?.type]);
```

**5. 300ms passes, fetch executes**

Backend receives request at:

📂 `backend/src/server.ts` **Line 141**

```typescript
app.get('/api/cities/search', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.query; // ← query = "New"

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.json({ cities: [] });
    }

    // In-memory city data (lines 158-197)
    const cities = [
      { name: 'New York', state: 'New York', stateCode: 'NY', displayName: 'New York, NY' },
      { name: 'New Orleans', state: 'Louisiana', stateCode: 'LA', displayName: 'New Orleans, LA' },
      // ... more cities
    ];

    const lowerQuery = query.toLowerCase(); // ← "new"
    const maxResults = Math.min(Number(limit) || 10, 20);

    // Filter matching cities
    const matchingCities = cities
      .filter(
        (city) =>
          city.name.toLowerCase().includes(lowerQuery) || // ← Matches "New York", "New Orleans"
          city.state.toLowerCase().includes(lowerQuery) ||
          city.stateCode.toLowerCase().includes(lowerQuery) ||
          city.displayName.toLowerCase().includes(lowerQuery)
      )
      .slice(0, maxResults); // ← Top 10 results

    res.json({ cities: matchingCities }); // ← Return to frontend
  } catch (error: any) {
    console.error('Error searching cities:', error.message);
    res.status(500).json({
      error: 'Failed to search cities',
      message: error.message,
    });
  }
});
```

**6. Frontend receives response**

Back to `QuestionFlow.tsx` **Line 67**

```tsx
const data = await response.json(); // ← { cities: [{name: 'New York', ...}, ...] }
setCitySuggestions(data.cities || []); // ← State updates
setShowSuggestions(data.cities?.length > 0); // ← Show dropdown
```

**7. Component re-renders with suggestions**

📂 `QuestionFlow.tsx` **Line 233**

```tsx
{
  showSuggestions && citySuggestions.length > 0 && (
    <div ref={suggestionsRef} className="suggestions-dropdown">
      {citySuggestions.map(
        (
          city // ← Renders each city
        ) => (
          <div
            key={`${city.name}-${city.stateCode}`}
            className="suggestion-item"
            onClick={() => handleCitySelect(city)} // ← Click handler
          >
            📍 {city.displayName} {/* "New York, NY" */}
          </div>
        )
      )}
    </div>
  );
}
```

---

## Flow 2: User Selects City from Dropdown

**1. User clicks "New York, NY"**

📂 `QuestionFlow.tsx` **Line 237**

```tsx
onClick={() => handleCitySelect(city)}  // ← FIRES HERE
```

**2. `handleCitySelect()` executes**

📂 `QuestionFlow.tsx` **Line 169**

```tsx
const handleCitySelect = (city: City) => {
  cityJustSelected.current = true; // ← Prevent re-fetch in useEffect

  const newAnswers = { ...answers, location: city.displayName };
  setAnswers(newAnswers); // ← State: { location: "New York, NY" }

  setErrors({ ...errors, location: '' }); // ← Clear errors
  setShowSuggestions(false); // ← Hide dropdown

  // Mark as validated (selected from suggestions)
  setValidatedCities(new Set(validatedCities).add('location')); // ← VALIDATED!

  // Clear suggestions to prevent reopening
  setCitySuggestions([]);
};
```

**3. useEffect triggers but exits early**

📂 `QuestionFlow.tsx` **Line 50**

```tsx
useEffect(() => {
  if (currentQuestion?.type !== 'autocomplete') return;

  // Don't fetch if we just selected a city
  if (cityJustSelected.current) {
    // ← TRUE, so exit early
    cityJustSelected.current = false;
    return; // ← STOPS HERE, no API call
  }
  // ... rest skipped
}, [currentValue, currentQuestion?.type]);
```

---

## Flow 3: User Clicks "Next" Button

**1. User clicks "Next →" button**

📂 `QuestionFlow.tsx` **Line 327**

```tsx
<button type="button" className="btn-primary" onClick={handleNext}>
  {isLastQuestion ? 'Search Events' : 'Next →'} // ← FIRES HERE
</button>
```

**2. `handleNext()` function executes**

📂 `QuestionFlow.tsx` **Line 115**

```tsx
const handleNext = () => {
  // Special validation for autocomplete location field
  if (currentQuestion.id === 'location' && currentQuestion.type === 'autocomplete') {
    if (!validatedCities.has('location')) {
      // ← Check if city was selected from dropdown
      setErrors({ ...errors, location: 'Please select a city from the suggestions' });
      return; // ← STOPS HERE if not validated
    }
  }

  // Validate current answer
  const validationErrors = validateAnswers({ [currentQuestion.id]: currentValue });

  if (validationErrors[currentQuestion.id]) {
    setErrors({ ...errors, [currentQuestion.id]: validationErrors[currentQuestion.id] });
    return; // ← STOPS HERE if validation fails
  }

  // Check if last question
  if (isLastQuestion) {
    // Final validation of ALL answers
    const allErrors = validateAnswers(answers);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    // Convert answers to search params
    const searchParams = answersToSearchParams(answers); // ← Transform data
    clearAnswers(); // ← Clear localStorage
    onComplete(searchParams); // ← Call parent component (App.tsx)
  } else {
    // Move to next question
    setCurrentQuestionIndex(currentQuestionIndex + 1); // ← Increment index
  }
};
```

**3. Validation logic executes**

📂 `config/questions.ts` **Line 155**

```tsx
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

    // Run custom validation if exists
    if (question.validation && value) {
      const error = question.validation(value);
      if (error) {
        errors[question.id] = error;
      }
    }
  }

  return errors; // ← { location: "error message" } or {}
}
```

**4. If valid, move to next question**

📂 `QuestionFlow.tsx` **Line 136**

```tsx
setCurrentQuestionIndex(currentQuestionIndex + 1); // ← 0 → 1
```

**5. Component re-renders**

📂 `QuestionFlow.tsx` **Line 36**

```tsx
const visibleQuestions = getVisibleQuestions(answers);
const currentQuestion = visibleQuestions[currentQuestionIndex]; // ← Now question #2
```

---

## Flow 4: User Clicks "Back" Button

**1. User clicks "← Back" button**

📂 `QuestionFlow.tsx` **Line 319**

```tsx
<button type="button" className="btn-secondary" onClick={handleBack}>
  ← Back // ← FIRES HERE
</button>
```

**2. `handleBack()` function executes**

📂 `QuestionFlow.tsx` **Line 148**

```tsx
const handleBack = () => {
  if (currentQuestionIndex > 0) {
    // ← Check not at first question
    setCurrentQuestionIndex(currentQuestionIndex - 1); // ← 1 → 0
  }
};
```

**3. Component re-renders**

📂 `QuestionFlow.tsx` **Line 36**

```tsx
const currentQuestion = visibleQuestions[currentQuestionIndex]; // ← Back to question #1
const currentValue = answers[currentQuestion?.id] || ''; // ← Previous answer: "New York, NY"
```

**4. Input shows previous answer**

📂 `QuestionFlow.tsx` **Line 230**

```tsx
<input
  value={currentValue}  // ← "New York, NY" appears in input
  ...
/>
```

---

## Flow 5: User Completes All Questions - API Search

**1. User clicks "Search Events" on last question**

📂 `QuestionFlow.tsx` **Line 127**

```tsx
if (isLastQuestion) {
  const searchParams = answersToSearchParams(answers);
  clearAnswers();
  onComplete(searchParams); // ← Calls parent callback
}
```

**2. Answer transformation**

📂 `config/questions.ts` **Line 177**

```tsx
export function answersToSearchParams(answers: Record<string, any>): Record<string, any> {
  const params: Record<string, any> = {};

  // Location
  if (answers.location) {
    const [city, stateCode] = answers.location.split(', ');
    params.city = city; // ← "New York"
    params.stateCode = stateCode; // ← "NY"
  }

  // Date range
  if (answers.dateRange) {
    const { startDateTime, endDateTime } = calculateDateRange(answers.dateRange);
    params.startDateTime = startDateTime;
    params.endDateTime = endDateTime;
  }

  // Event type
  if (answers.eventType) {
    params.classificationName = answers.eventType; // ← "Music"
  }

  // Keywords
  if (answers.keywords) {
    params.keyword = answers.keywords; // ← "Taylor"
  }

  return params; // ← { city: "New York", stateCode: "NY", keyword: "Taylor", ... }
}
```

**3. Parent component receives search params**

📂 `App.tsx` **Line 21**

```tsx
const handleSearch = async (searchParams: Record<string, any>) => {
  setIsLoading(true);
  setError(null);

  try {
    // Call API service
    const result = await searchEvents(searchParams); // ← API call starts
    setResults(result.events);
    setShowResults(true);
  } catch (err: any) {
    setError(err.message || 'Failed to search events');
  } finally {
    setIsLoading(false);
  }
};
```

**4. API service layer**

📂 `services/api.ts` **Line 15**

```typescript
export async function searchEvents(params: SearchParams): Promise<SearchResult> {
  const queryString = new URLSearchParams(params as any).toString();

  // Call backend proxy
  const response = await fetch(`${API_BASE_URL}/events/search?${queryString}`);

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  return await response.json();
}
```

**5. Backend receives search request**

📂 `backend/src/server.ts` **Line 57**

```typescript
app.get('/api/events/search', async (req: Request, res: Response) => {
  try {
    const {
      keyword,      // ← "Taylor"
      city,         // ← "New York"
      stateCode,    // ← "NY"
      classificationName,
      startDateTime,
      endDateTime,
      size = 20,
      page = 0
    }: EventSearchParams = req.query;

    // Build Ticketmaster API params
    const params: any = {
      apikey: TICKETMASTER_API_KEY,
      size,
      page,
    };

    if (keyword) params.keyword = keyword;
    if (city) params.city = city;
    if (stateCode) params.stateCode = stateCode;
    // ... add other params

    console.log('Searching events with params:', { ...params, apikey: '[REDACTED]' });

    // Call Ticketmaster API
    const response = await axios.get(`${TICKETMASTER_BASE_URL}/events.json`, {
      params,
      timeout: 10000,
    });

    // Transform response
    const events = response.data._embedded?.events || [];
    const transformedEvents = events.map((event: any, index: number) => ({
      id: event.id,
      name: event.name,
      url: event.url,
      image: event.images?.[0]?.url,
      date: event.dates?.start?.localDate,
      venue: event._embedded?.venues?.[0]?.name,
      city: event._embedded?.venues?.[0]?.city?.name,
      // ... flatten nested data

      // Add relevance scoring
      relevanceFactors: {
        position: index + 1,
        hasKeywordMatch: keyword ? event.name.toLowerCase().includes(keyword.toLowerCase()) : null,
        matchesClassification: classificationName ? /* check */ : null,
        matchesCity: city ? /* check */ : null,
      },
    }));

    // Send response to frontend
    res.json({
      events: transformedEvents,
      page: response.data.page,
      totalEvents: response.data.page?.totalElements || 0,
    });
  } catch (error: any) {
    // Error handling (lines 120-140)
    // ...
  }
});
```

**6. Frontend receives results**

📂 `App.tsx` **Line 24**

```tsx
const result = await searchEvents(searchParams);
setResults(result.events); // ← State updates with event array
setShowResults(true); // ← Show EventResults component
```

**7. Results component renders**

📂 `EventResults.tsx` **Line 50**

```tsx
<div className="results-table">
  <table>
    <thead>
      <tr>
        <th>Event</th>
        <th>Date</th>
        <th>Venue</th>
        {/* ... more columns */}
      </tr>
    </thead>
    <tbody>
      {filteredAndSortedEvents.map(
        (
          event // ← Render each event row
        ) => (
          <tr key={event.id}>
            <td>{event.name}</td>
            <td>{formatDate(event.date)}</td>
            <td>{event.venue}</td>
            {/* ... more cells */}
          </tr>
        )
      )}
    </tbody>
  </table>
</div>
```

---

## Flow 6: localStorage Persistence

**Auto-save on every answer change**

📂 `QuestionFlow.tsx` **Line 43**

```tsx
useEffect(() => {
  if (Object.keys(answers).length > 0) {
    saveAnswers(answers); // ← Save to localStorage
  }
}, [answers]); // ← Runs whenever answers change
```

📂 `utils/storage.ts` **Line 13**

```typescript
export function saveAnswers(answers: Record<string, any>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    // ← { location: "New York, NY", dateRange: "this-week", ... }
  } catch (error) {
    console.error('Failed to save answers:', error);
  }
}
```

**Load on component mount**

📂 `QuestionFlow.tsx` **Line 21**

```tsx
const savedAnswers = loadAnswers(); // ← Read from localStorage on mount
const [answers, setAnswers] = useState<Record<string, any>>(savedAnswers || initialAnswers);
```

📂 `utils/storage.ts` **Line 27**

```typescript
export function loadAnswers(): Record<string, any> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load answers:', error);
    return null;
  }
}
```

---

## Summary: Complete Request-Response Cycle

```
USER ACTION → React State → useEffect → API Request → Backend → Ticketmaster → Backend → Frontend → React State → UI Update

Example: Type "New York"
1. onChange (Line 230)
2. handleAnswer (Line 96)
3. setAnswers (Line 98)
4. useEffect triggers (Line 47)
5. setTimeout 300ms (Line 77)
6. Fetch /api/cities/search (Line 66)
7. Backend receives (Line 141)
8. Filter cities (Line 199)
9. Return JSON (Line 211)
10. setCitySuggestions (Line 67)
11. Render dropdown (Line 233)
```

## Key Performance Optimizations

1. **Debouncing** (Line 77) - Wait 300ms before fetching to reduce API calls
2. **Cleanup function** (Line 79) - Cancel previous timer when user keeps typing
3. **Early returns** (Lines 50-62) - Skip unnecessary work in useEffect
4. **In-memory cities** (Backend Line 158) - Zero latency for autocomplete
5. **Timeout** (Backend Line 79) - Prevent hanging requests (10 seconds)

## Key State Management Points

- **answers** - Main form state, triggers persistence
- **currentValue** - Derived from answers, triggers API fetch
- **validatedCities** - Tracks which cities were selected from dropdown vs typed
- **cityJustSelected** - Prevents re-fetch after dropdown selection
- **showSuggestions** - Controls dropdown visibility
