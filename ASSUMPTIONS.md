# Assumptions & Shortcuts

This document explicitly outlines assumptions made and shortcuts taken to complete this prototype quickly.

## 🎯 Prototype vs Production

**This is a prototype**, not production-ready code. The focus was on demonstrating technical skills and problem-solving approach within a reasonable timeframe (~5 hours).

## 📝 Key Assumptions

### 1. **API Key Security**

- **Assumption**: Using a backend proxy is sufficient for this demo
- **Shortcut**: No authentication on backend endpoints
- **Production**: Would add API key rotation, request signing, rate limiting per user

### 2. **City Data**

- **Assumption**: Hardcoded list of ~40 major US cities is sufficient
- **Shortcut**: In-memory array instead of database or geocoding API
- **Production**: Would use Google Places API or US Census data, support international cities

### 3. **Styling & UI**

- **Assumption**: Clean and functional is more important than beautiful
- **Shortcut**: Plain CSS, no UI framework, basic responsive design
- **Production**: Would use Tailwind or MUI for consistency, add animations, better mobile UX

### 4. **Data Persistence**

- **Assumption**: localStorage is acceptable for demo user progress
- **Shortcut**: No backend user accounts, no data sync across devices
- **Production**: Would add user authentication, database storage, cloud sync

### 5. **Error Handling**

- **Assumption**: Generic error messages are good enough
- **Shortcut**: No error tracking, no retry logic, no offline detection
- **Production**: Would add Sentry, implement exponential backoff, better offline UX

### 6. **Testing**

- **Assumption**: Test high-value code (pure functions, critical flows)
- **Shortcut**: 62 tests focused on business logic, minimal UI testing
- **Production**: Would add E2E tests (Playwright), visual regression tests, accessibility tests

### 7. **Performance**

- **Assumption**: 1-50 concurrent users is acceptable target
- **Shortcut**: No caching, no CDN, no code splitting
- **Production**: Would add Redis caching, lazy loading, CDN for assets, service worker for PWA

### 8. **Accessibility**

- **Assumption**: Basic semantic HTML is sufficient
- **Shortcut**: No ARIA labels, no keyboard shortcut documentation, not fully tested with screen readers
- **Production**: Would meet WCAG 2.1 AA standards, test with real assistive technology

### 9. **Mobile Experience**

- **Assumption**: Responsive CSS is good enough
- **Shortcut**: Not tested on actual devices, basic breakpoints only
- **Production**: Would test on real devices, add touch gestures, consider React Native app

### 10. **Date Handling**

- **Assumption**: Native Date API is sufficient for basic date ranges
- **Shortcut**: Simple date calculations, no timezone handling, no date picker component
- **Production**: Would use date-fns or Luxon, proper timezone support, custom date picker

## 🚀 Quick Wins (Done in < 1 hour each)

Things that look complex but were actually quick to implement:

1. **Configurable Questions** - Single config file with array of question objects
2. **localStorage Persistence** - Trivial with JSON.stringify/parse
3. **Relevance Transparency** - Simple object with boolean flags
4. **City Autocomplete** - Basic filter on hardcoded array
5. **Express Proxy** - 50 lines of code to wrap Ticketmaster API

## ❌ What's NOT Implemented

Explicitly **not** included to save time:

- ❌ User accounts / authentication
- ❌ Favorites / saved searches
- ❌ Event details page (just links to Ticketmaster)
- ❌ Map view of events
- ❌ Calendar integration
- ❌ Social sharing
- ❌ Email notifications
- ❌ Advanced filters (venue, price)
- ❌ Dark mode
- ❌ Internationalization

## 🎨 Design Choices

### Why No UI Framework?

**Assumption**: For a prototype, custom CSS is faster than learning a new component library

**Trade-offs**:

- ✅ Faster development (no library learning curve)
- ✅ Smaller bundle size (~150KB vs 500KB+)
- ✅ No version conflicts or breaking changes
- ❌ Less consistent design language
- ❌ More CSS to write for complex components
- ❌ No out-of-box accessibility features

**Would change for**: Team of 3+ developers, customer-facing product, long-term maintenance

### Why localStorage not Backend?

**Assumption**: Client-side storage is acceptable for MVP user progress

**Trade-offs**:

- ✅ Zero backend complexity
- ✅ Works offline
- ✅ Instant save/load (no network delay)
- ❌ Doesn't sync across devices
- ❌ User loses data if they clear browser
- ❌ No analytics on user behavior

**Would change for**: Multi-device support, user analytics needed, social features

### Why Simple Tests?

**Assumption**: Pure function tests + smoke tests give 80% confidence with 20% effort

**Trade-offs**:

- ✅ Tests are fast (< 1 second total)
- ✅ Easy to maintain
- ✅ Focus on business logic
- ❌ No E2E coverage
- ❌ UI interactions not fully tested
- ❌ Edge cases might be missed

**Would change for**: Production release, complex UI interactions critical, compliance requirements

## 🔍 Code Quality Considerations

### What I Prioritized

1. **TypeScript strict mode** - Catch errors at compile time
2. **Clear naming** - Functions and variables explain themselves
3. **Small functions** - Most functions < 20 lines
4. **Documentation** - Comments explain WHY, not WHAT
5. **Error handling** - User-friendly messages, graceful degradation

### What I Deprioritized

1. **Perfect pixel design** - Functional > beautiful
2. **100% test coverage** - Focused on high-value tests
3. **Optimization** - No premature optimization (fast enough for demo)
4. **Cross-browser testing** - Assumes modern Chrome/Firefox/Safari
5. **Security hardening** - Basic practices, not production-grade

## 💡 Questions I Would Ask Product/Design

Before building this for real, I'd clarify:

1. **Target audience**: Who are the users? Age? Tech-savviness?
2. **Success metrics**: What does success look like? Conversion rate? Time to search?
3. **Priority features**: What's P0 vs P1 vs nice-to-have?
4. **Mobile importance**: Is this mobile-first? Desktop-first? Equal priority?
5. **International scope**: US-only or international events?
6. **Competition**: Who are we competing with? What do they do well/poorly?
7. **Monetization**: Free? Freemium? Subscription? Affects UX decisions

## ⚡ Performance Budget (Not Enforced)

If this were production, I'd set these limits:

- **Time to Interactive**: < 3 seconds on 3G
- **Bundle Size**: < 200KB gzipped
- **API Response**: < 500ms p95
- **Lighthouse Score**: > 90 on all metrics

Current prototype meets these naturally, but no enforcement or monitoring in place.

## 🎯 Summary

**Bottom line**: I made deliberate choices to build quickly while maintaining code quality. Every shortcut is documented, and I've outlined what I'd do differently with more time or for production.

The prototype demonstrates:

- ✅ Technical competence (React, TypeScript, Express, testing)
- ✅ Product thinking (UX considerations, error handling)
- ✅ Communication (documentation, code comments)
- ✅ Pragmatism (shipping > perfection for demos)
