# 🎉 Event Finder - VDX Coding Challenge

A full-stack event discovery application built with React, TypeScript, and Express that helps users find events based on their preferences using the Ticketmaster API.

## 📋 Features

### ✅ All Requirements Implemented

1. **Configurable Question Flow** - Questions are defined in a configuration file, making updates easy without UI changes
2. **User Persistence** - Progress is automatically saved to localStorage; users can resume where they left off
3. **Result Transparency** - Each result shows relevance factors (keyword match, classification match, city match, API position)
4. **Result Filtering** - Filter by search term, city, genre, price range, and sort by relevance, date, or name
5. **Error Handling** - Graceful error handling with user-friendly messages for API failures, validation errors, and edge cases
6. **Reverse Proxy Backend** - Express server proxies requests to Ticketmaster API, keeping API keys secure
7. **React + TypeScript** - Built with modern React hooks and full TypeScript typing
8. **Unit Tests** - Vitest + React Testing Library for component and utility testing

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)

```
src/
├── components/           # React components
│   ├── QuestionFlow.tsx  # Multi-step question interface
│   ├── EventResults.tsx  # Results table with filtering
│   ├── ErrorBoundary.tsx # Error boundary wrapper
│   └── Loading.tsx       # Loading spinner
├── config/
│   └── questions.ts      # Configurable question definitions
├── services/
│   └── api.ts           # API service layer
├── utils/
│   └── storage.ts       # localStorage persistence
├── test/                # Unit tests
└── types.ts             # TypeScript type definitions
```

### Backend (Express + TypeScript)

```
backend/
└── src/
    └── server.ts        # Express server with Ticketmaster proxy
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Ticketmaster API key (get one at https://developer.ticketmaster.com/)

### Installation

1. **Clone the repository**

```bash
cd event-finder
npm install
```

2. **Set up environment variables**

```bash
# Create .env file
cp .env.example .env

# Edit .env and add your Ticketmaster API key
TICKETMASTER_API_KEY=your_api_key_here
PORT=3001
```

3. **Start both frontend and backend**

```bash
# Option 1: Run both concurrently
npm start

# Option 2: Run separately
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

4. **Open the app**

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 🎯 Design Decisions

### Framework Choice: Vite + React

- **Vite**: Chosen for fast development experience and optimized production builds
- **React 19**: Latest stable version with modern hooks
- **TypeScript**: Full type safety reduces runtime errors

**Boilerplate Reduction Strategy:**

- Removed unused Vite template files
- Minimal dependencies (only what's needed)
- Tree-shaking configured automatically by Vite
- No unnecessary build plugins
- Component-scoped CSS instead of heavy UI frameworks

### State Management

- Used React hooks (`useState`, `useEffect`, `useMemo`) instead of Redux/Context
- **Why**: Simple app state doesn't justify additional complexity
- **Production consideration**: Would add Context API or Zustand for larger apps

### Styling Approach

- Plain CSS with component-scoped files
- **Why**: Quick to implement, no build setup needed
- **Production consideration**: Would use CSS Modules, Styled Components, or Tailwind for scalability

### Data Persistence

- localStorage for client-side persistence
- **Why**: Simple, synchronous, works offline
- **Limitations**:
  - 5-10MB storage limit
  - Not secure for sensitive data
  - Doesn't sync across devices
- **Production consideration**:
  - Backend user accounts with database storage
  - IndexedDB for larger datasets
  - Encryption for sensitive data

### API Architecture

- Backend reverse proxy instead of direct frontend API calls
- **Why**:
  - Keeps API keys secure
  - Allows request transformation/validation
  - Enables caching and rate limiting
  - Provides consistent error handling
- **Production consideration**: Add Redis caching, request throttling, API versioning

### Error Handling

Three layers of error handling:

1. **API Service Layer**: Transforms errors into user-friendly messages
2. **Component Level**: Form validation and user input errors
3. **Error Boundary**: Catches React rendering errors

### Testing Strategy

Focused on:

- **Utility functions** (storage, date calculations) - High value, easy to test
- **Component behavior** (QuestionFlow navigation, validation) - Core user flows
- **Configuration** (question config validation) - Prevents runtime issues

**Tests I would add with more time:**

- Integration tests for full user journeys
- API mocking with MSW (Mock Service Worker)
- E2E tests with Playwright or Cypress
- Accessibility testing with jest-axe
- Visual regression testing
- Performance testing

## 🔧 Configuration

### Question Configuration

Questions are defined in `src/config/questions.ts`. To add/modify questions:

```typescript
{
  id: 'uniqueId',
  type: 'select' | 'text' | 'multiselect' | 'date',
  question: 'Your question text',
  placeholder: 'Placeholder text',
  required: true,
  options: [{ value: 'val', label: 'Label' }],
  validation: (value) => value ? null : 'Error message'
}
```

### Environment Variables

```
TICKETMASTER_API_KEY=your_key_here  # Required
PORT=3001                            # Optional, defaults to 3001
```

## 🚨 Known Limitations & Trade-offs

### Shortcuts Taken (by design)

1. **No authentication** - Would add user accounts in production
2. **Limited caching** - Would add Redis for API response caching
3. **Basic styling** - Focused on functionality over aesthetics
4. **Single API source** - Easy to extend to multiple event APIs
5. **No pagination UI** - Backend supports it, frontend could add
6. **localStorage only** - Would sync to backend in production

### Production Improvements

- [ ] User authentication and authorization
- [ ] Backend request caching (Redis)
- [ ] Rate limiting and API quotas
- [ ] Logging and monitoring (Datadog, Sentry)
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Database for user preferences and search history
- [ ] Social sharing features
- [ ] Email notifications for saved searches
- [ ] Mobile app (React Native)
- [ ] Internationalization (i18n)
- [ ] Analytics tracking
- [ ] SEO optimization
- [ ] PWA support for offline access

## 📊 API Documentation

### Backend Endpoints

#### `GET /api/health`

Health check endpoint

- **Response**: `{ status: 'ok', timestamp: string }`

#### `GET /api/events/search`

Search for events based on criteria

- **Query Parameters**:
  - `keyword`: Search term (e.g., "Taylor Swift")
  - `city`: City name
  - `stateCode`: US state code (e.g., "NY")
  - `classificationName`: Event type (Music, Sports, Arts, etc.)
  - `startDateTime`: ISO datetime string
  - `endDateTime`: ISO datetime string
  - `size`: Results per page (default: 20)
  - `page`: Page number (default: 0)
- **Response**: Event array with relevance factors

## 🧪 Testing

### Test Coverage

- ✅ Storage utility (localStorage operations)
- ✅ Date range calculations
- ✅ Question flow navigation
- ✅ Form validation
- ✅ Error states

### Running Tests

```bash
npm test              # Run once
npm run test:ui       # Interactive UI
npm run test:coverage # With coverage report
```

## 📦 Dependencies

### Core Dependencies

- `react` - UI library
- `react-dom` - React rendering
- `typescript` - Type safety
- `express` - Backend server
- `axios` - HTTP client
- `cors` - CORS middleware
- `dotenv` - Environment variables

### Development Dependencies

- `vite` - Build tool
- `vitest` - Testing framework
- `@testing-library/react` - Component testing
- `tsx` - TypeScript execution
- `nodemon` - Development auto-reload
- `concurrently` - Run multiple commands

## 🤝 Contributing

This is a coding challenge submission, but if this were a team project:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Submit a pull request
5. Ensure CI passes

## 📝 License

MIT License - This is a demo project for interview purposes

## 👤 Author

**Karl Kwon**

Built for Vendelux's Full-Stack Engineering Position

---

## 💭 Reflections

### What Went Well

- Clean separation of concerns (components, services, utils)
- Comprehensive error handling
- Type-safe implementation
- Easy-to-modify configuration
- Good test coverage for critical paths

### What I Would Improve

- More comprehensive test suite
- Better mobile responsive design
- Implement actual date range picker component
- Add result caching for faster subsequent searches
- Better loading states with skeleton screens
- Add animations and transitions
- Implement keyboard shortcuts for power users

### Time Breakdown (approximate)

- Project setup & architecture: 30 min
- Backend API proxy: 1 hour
- Frontend components: 2.5 hours
- Styling: 1 hour
- Testing: 1 hour
- Documentation: 45 min
- **Total: ~6.5 hours**

Thank you for reviewing my submission! I'm happy to discuss any design decisions or answer questions.
