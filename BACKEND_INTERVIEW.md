# Backend Interview Q&A: Event Finder API

## Architecture & Design

### Q: Walk us through your API architecture. Why use a reverse proxy pattern?

**A:** Our server acts as a **reverse proxy/gateway** between frontend and Ticketmaster API:

```
Frontend → Express Server (our API) → Ticketmaster API
           ↓
         Response Transform
         Relevance Scoring (calculateRelevanceScore)
         Error Handling
```

**Benefits:**

1. **API Abstraction** - Frontend doesn't know about Ticketmaster internals
2. **Response Transformation** - Add custom fields (relevance scoring, formatted data)
3. **Security** - Hide API key server-side, never expose to client
4. **Caching** - Can cache responses without modifying upstream API
5. **Rate Limiting** - Control client access independent of Ticketmaster limits
6. **Error Handling** - Normalize error responses across endpoints

**Example:**

```typescript
// Frontend sees our clean response with relevance scoring
{
  events: [{
    name: "Taylor Swift Concert",
    relevanceScore: 88,  // 0-100 score calculated by backend
    relevanceFactors: {
      position: 1,
      hasKeywordMatch: true,
      matchesClassification: true,
      matchesCity: true,
    }
  }],
  page: { totalElements: 2808, totalPages: 141, number: 2 },
  totalEvents: 2808
}

// But Ticketmaster returns complex nested structure
{
  _embedded: { events: [...] },
  page: { ... },
  // plus other fields we don't need
}
```

---

### Q: How does your relevance scoring algorithm work?

**A:** We use a dedicated `relevance.ts` module with **pure functions** for deterministic, testable scoring:

**Scoring Formula (0-100 scale):**

```typescript
Base Score:              20 points
Position Bonus:          0-18 points (top 10 results, diminishing)
Keyword Match:           +30 points (if event name contains keyword)
Classification Match:    +25 points (if event type matches)
City Match:              +25 points (if location matches)
                         ─────────
Maximum Score:           100 points
```

**Implementation:**

```typescript
// relevance.ts - Pure functions for scoring
export function calculateRelevanceScore(factors: RelevanceFactors): number {
  let score = 20; // Base score

  // Position penalty (first result gets more points)
  if (factors.position <= 10) {
    score += (10 - factors.position) * 2; // 0-18 points
  }

  // Keyword match bonus
  if (factors.hasKeywordMatch === true) score += 30;

  // Classification match bonus
  if (factors.matchesClassification === true) score += 25;

  // City match bonus
  if (factors.matchesCity === true) score += 25;

  return Math.min(score, 100); // Cap at 100
}

// Used in server.ts
const relevanceFactors = calculateRelevanceFactors(eventData, searchCriteria, index + 1);
const relevanceScore = calculateRelevanceScore(relevanceFactors);
```

**Why Pure Functions?**

1. **Testable** - Same input always produces same output
2. **No Side Effects** - Doesn't modify external state
3. **Composable** - Easy to combine multiple scoring functions
4. **Debuggable** - Clear input → output flow

**Real Example:**

```typescript
// Search: keyword="Swift", city="Boston", type="Music"
// Event 1: "Taylor Swift Concert" in Boston, Music
{
  position: 1,           // +18 points (position bonus)
  hasKeywordMatch: true, // +30 points
  matchesCity: true,     // +25 points
  matchesClass: true,    // +25 points
}
Score: 20 + 18 + 30 + 25 + 25 = 98/100

// Event 15: "Swift Transportation Expo" in Boston, Sports
{
  position: 15,           // +0 points (outside top 10)
  hasKeywordMatch: true,  // +30 points (keyword in name)
  matchesCity: true,      // +25 points
  matchesClass: false,    // +0 points (wrong type)
}
Score: 20 + 0 + 30 + 25 + 0 = 75/100
```

**Result Transparency:**
Frontend displays this breakdown in a tooltip when users hover over the relevance score, showing exactly why each event got its score.

---

### Q: How would you handle multiple data sources (not just Ticketmaster)?

**A:**

```typescript
interface EventSource {
  search(params: SearchParams): Promise<Event[]>;
  getEvent(id: string): Promise<Event>;
}

class TicketmasterSource implements EventSource {
  async search(params: SearchParams) {
    // Ticketmaster implementation
  }
}

class EventbriteSource implements EventSource {
  async search(params: SearchParams) {
    // Eventbrite implementation
  }
}

class EventAggregator {
  private sources: EventSource[];

  async searchAll(params: SearchParams) {
    const results = await Promise.all(this.sources.map((source) => source.search(params)));

    return {
      events: this.mergeAndDeduplicate(results),
      sources: this.sources.map((s) => s.name),
    };
  }

  private mergeAndDeduplicate(results: Event[][]) {
    const eventMap = new Map<string, Event>();

    results.flat().forEach((event) => {
      const key = `${event.name}-${event.date}-${event.city}`;
      if (!eventMap.has(key)) {
        eventMap.set(key, event);
      }
    });

    return Array.from(eventMap.values());
  }
}
```

---

## API Design & Endpoints

### Q: How do you design REST endpoints? What principles did you follow?

**A:** REST principles we followed:

```typescript
// ✅ Good: Resource-centric, descriptive, standard HTTP methods
GET    /api/events/search          // List with filters
GET    /api/events/:id             // Get single
POST   /api/events                 // Create (if needed)
GET    /api/cities/search          // Autocomplete
GET    /api/classifications        // Category list

// ❌ Bad: Verb-centric, unclear
GET    /api/searchEvents
GET    /api/getCityList
POST   /api/doSearch
```

**REST Principles Applied:**

1. **Resource-Centric** - Each endpoint represents a resource (`/events`, `/cities`)
2. **Standard HTTP Methods** - GET for retrieval, POST for creation, PUT for update, DELETE for deletion
3. **Status Codes** - 200 OK, 400 Bad Request, 404 Not Found, 500 Server Error
4. **Pagination** - Standard `page` and `size` parameters
5. **Filtering** - Query params like `?keyword=Taylor&city=NYC`
6. **Consistent Responses** - All endpoints follow same JSON structure

**Standard Response Structure:**

```typescript
// Success
{
  events: [...],
  page: { totalElements, totalPages, number },
  totalEvents: number
}

// Error
{
  error: "Failed to fetch events",
  message: "Descriptive error",
  details: { ... } // Additional context
}
```

---

### Q: How would you version your API?

**A:**

```typescript
// URL Versioning (clearest)
app.get('/api/v1/events/search', handleV1);
app.get('/api/v2/events/search', handleV2);

// Header Versioning (RESTful)
app.get('/api/events/search', (req, res) => {
  const version = req.headers['api-version'] || '1';
  if (version === '1') handleV1();
  if (version === '2') handleV2();
});

// Semantic Versioning
// v1.0.0 - Initial release
// v1.1.0 - Added event images (non-breaking)
// v2.0.0 - Changed response format (breaking)
```

**Best Practice:** URL versioning is clearest for clients and servers:

- Easy to test different versions
- Clear in documentation
- Can run multiple versions simultaneously
- Deprecation path is obvious

---

## Error Handling

### Q: How should we handle different error scenarios?

**A:** Layered error handling:

```typescript
app.get('/api/events/search', async (req: Request, res: Response) => {
  try {
    // Validate input
    if (!req.query.city && !req.query.keyword) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Either city or keyword required',
      });
    }

    // Call external API
    const response = await axios.get(TICKETMASTER_URL, {
      timeout: 10000, // Fail fast
    });

    // Transform and return
    res.json({ events: transform(response.data) });
  } catch (error: any) {
    // Handle different error types
    if (error.response?.status === 401) {
      // Invalid API key
      console.error('Invalid Ticketmaster API key');
      res.status(500).json({
        error: 'Configuration Error',
        message: 'API not configured properly',
      });
    } else if (error.response?.status === 429) {
      // Rate limited by Ticketmaster
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Try again later.',
        retryAfter: error.response.headers['retry-after'],
      });
    } else if (error.request && !error.response) {
      // Network error - couldn't reach API
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Ticketmaster API is unreachable',
      });
    } else {
      // Client error
      res.status(400).json({
        error: 'Bad Request',
        message: error.message,
      });
    }
  }
});
```

**Error Response Standard:**

| Status | Cause                        | Action                 |
| ------ | ---------------------------- | ---------------------- |
| 400    | Bad request (invalid params) | Client fixes request   |
| 401    | Unauthorized (API key)       | Server fixes config    |
| 403    | Forbidden                    | Client not allowed     |
| 404    | Not found                    | Client checks URL      |
| 429    | Rate limited                 | Client waits & retries |
| 500    | Server error                 | Server logs & fixes    |
| 503    | Service unavailable          | Client retries later   |

---

## Caching & Performance

### Q: How would you implement caching? What strategy?

**A:** Multi-layer caching strategy:

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Cache key generator
function getCacheKey(params: SearchParams): string {
  return `events:${JSON.stringify(params)}`;
}

app.get('/api/events/search', async (req: Request, res: Response) => {
  const cacheKey = getCacheKey(req.query);

  try {
    // 1. Check Redis cache (fast)
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('Cache hit:', cacheKey);
      return res.json(JSON.parse(cached));
    }

    // 2. If not cached, fetch from API
    const data = await fetchFromTicketmaster(req.query);

    // 3. Cache for 1 hour (different for different endpoints)
    await redis.setex(cacheKey, 3600, JSON.stringify(data));

    res.json(data);
  } catch (error) {
    // If API fails but cache exists, return stale data
    const staleCached = await redis.get(cacheKey);
    if (staleCached) {
      return res.json(JSON.parse(staleCached));
    }

    throw error;
  }
});

// Cache invalidation
app.post('/api/cache/clear', (req: Request, res: Response) => {
  redis.flushdb();
  res.json({ message: 'Cache cleared' });
});
```

**Caching Strategy by Endpoint:**

| Endpoint           | TTL      | Strategy                  |
| ------------------ | -------- | ------------------------- |
| `/events/search`   | 1 hour   | Cache entire response     |
| `/classifications` | 24 hours | Static data, long cache   |
| `/cities/search`   | 7 days   | Rarely changes            |
| `/events/:id`      | 2 hours  | Details change frequently |

**Cache Invalidation Approaches:**

```typescript
// 1. TTL (Time To Live) - simplest
await redis.setex('key', 3600, value); // Expires in 1 hour

// 2. Event-based - invalidate on external events
EventEmitter.on('ticketmaster-update', () => {
  redis.del('events:*');
});

// 3. LRU (Least Recently Used)
// Remove oldest accessed items when cache full

// 4. Hybrid - TTL + event-based
// Cache with 1-hour TTL, but invalidate immediately on new events
```

---

### Q: How would you optimize database queries?

**A:**

```typescript
// If using database instead of in-memory city list:

// 1. Index frequently searched columns
CREATE INDEX idx_city_name ON cities(name);
CREATE INDEX idx_city_state ON cities(state_code);
CREATE INDEX idx_city_combined ON cities(name, state_code);

// 2. Pagination for large result sets
async function getEventsByCity(city: string, limit: number, offset: number) {
  return db.query(
    'SELECT * FROM events WHERE city = $1 LIMIT $2 OFFSET $3',
    [city, limit, offset]
  );
}

// 3. Use connection pooling
const pool = new Pool({
  max: 20,  // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 4. Query optimization
// ❌ Slow: N+1 queries
events.forEach(event => {
  const venue = db.query('SELECT * FROM venues WHERE id = ?', event.venue_id);
});

// ✅ Fast: Single JOIN
const eventsWithVenues = db.query(
  'SELECT e.*, v.* FROM events e JOIN venues v ON e.venue_id = v.id'
);

// 5. Select only needed columns
// ❌ Slow
SELECT * FROM events;

// ✅ Fast
SELECT id, name, date, city, venue FROM events;
```

---

## Rate Limiting & Throttling

### Q: How would you implement rate limiting?

**A:**

```typescript
import rateLimit from 'express-rate-limit';

// Limit requests per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:', // Redis key prefix
  }),
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, fallback to IP
    return req.user?.id || req.ip;
  },
});

app.use('/api/', limiter);

// Stricter limit for expensive operations
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Only 10 searches per minute
});

app.get('/api/events/search', searchLimiter, eventSearchHandler);

// Headers returned to client
// X-RateLimit-Limit: 100
// X-RateLimit-Remaining: 95
// X-RateLimit-Reset: 1640000000
```

**Rate Limiting Strategy:**

```typescript
// Different limits for different endpoints
const apiLimits = {
  '/events/search': { window: '1m', max: 10 },
  '/cities/search': { window: '5m', max: 50 },
  '/classifications': { window: '1h', max: 100 },
  '/events/:id': { window: '1m', max: 30 },
};

// Different limits for different users
const getPremiumLimit = (req: Request) => {
  if (req.user?.isPremium) return 1000; // Premium: 1000 req/hour
  return 100; // Free: 100 req/hour
};
```

---

## Security

### Q: What security measures should we implement?

**A:**

```typescript
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';

// 1. Set security HTTP headers
app.use(helmet()); // Prevents XSS, clickjacking, etc.

// 2. Sanitize user input
app.use(mongoSanitize()); // Prevents NoSQL injection

// 3. API Key validation
const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-api-key'];

  if (!key || !validApiKeys.includes(key)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

app.use('/api/', validateApiKey);

// 4. CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-API-Key'],
  })
);

// 5. Environment variables (never expose secrets)
const API_KEY = process.env.TICKETMASTER_API_KEY; // Not hardcoded
// Use AWS Secrets Manager, HashiCorp Vault, or similar in production

// 6. Input validation
const validateSearchParams = (req: Request, res: Response, next: NextFunction) => {
  const { keyword, city, size, page } = req.query;

  if (size && Number(size) > 1000) {
    return res.status(400).json({ error: 'Max size is 1000' });
  }

  if (keyword && keyword.length > 200) {
    return res.status(400).json({ error: 'Keyword too long' });
  }

  next();
};

app.get('/api/events/search', validateSearchParams, searchHandler);

// 7. HTTPS only (in production)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});

// 8. Logging & monitoring (don't log sensitive data)
app.use((req, res, next) => {
  console.log({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    // Don't log: API keys, passwords, personal data
  });
  next();
});
```

---

## Testing

### Q: How would you test the API?

**A:**

```typescript
import request from 'supertest';
import app from './server';

describe('Event Search API', () => {
  // Unit test
  it('should transform Ticketmaster response correctly', () => {
    const raw = {
      id: '123',
      name: 'Concert',
      _embedded: {
        venues: [{ name: 'Madison Square Garden' }]
      }
    };

    const transformed = transformEvent(raw, 0);

    expect(transformed).toEqual({
      id: '123',
      name: 'Concert',
      venue: 'Madison Square Garden',
      relevanceFactors: { ... }
    });
  });

  // Integration test
  it('should search events by city', async () => {
    const response = await request(app)
      .get('/api/events/search')
      .query({ city: 'New York' })
      .expect(200);

    expect(response.body).toHaveProperty('events');
    expect(response.body).toHaveProperty('page');
    expect(Array.isArray(response.body.events)).toBe(true);
  });

  // Error handling test
  it('should return 400 for missing parameters', async () => {
    const response = await request(app)
      .get('/api/events/search')
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  // Rate limiting test
  it('should rate limit after max requests', async () => {
    for (let i = 0; i < 11; i++) {
      const response = await request(app).get('/api/events/search?city=NYC');

      if (i < 10) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429); // Too Many Requests
      }
    }
  });

  // Mock external API
  it('should handle Ticketmaster API failure gracefully', async () => {
    jest.spyOn(axios, 'get').mockRejectedValueOnce(new Error('API Down'));

    const response = await request(app)
      .get('/api/events/search?city=NYC')
      .expect(503);

    expect(response.body.error).toBe('Service Unavailable');
  });
});
```

---

## Scalability & Deployment

### Q: How would you scale this API to handle millions of requests?

**A:**

```typescript
// 1. Load Balancing
// nginx.conf
upstream backend {
  server 127.0.0.1:3001;
  server 127.0.0.1:3002;
  server 127.0.0.1:3003;
  # Round-robin across multiple instances
}

server {
  listen 80;
  location /api {
    proxy_pass http://backend;
  }
}

// 2. Database Connection Pooling
const pool = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 3. Caching Strategy (as discussed)
// Redis for hot data, database for everything else

// 4. CDN for Static Content
// Images, classifications → CloudFront/CloudFlare

// 5. Horizontal Scaling
// Run multiple instances behind load balancer
npm start -- --port 3001
npm start -- --port 3002
npm start -- --port 3003

// 6. Database Optimization
// - Read replicas
// - Sharding (partition by city)
// - Archive old events

// 7. Monitoring & Alerts
import prometheus from 'prom-client';

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration.labels(req.method, req.route, res.statusCode).observe(duration);
  });
  next();
});
```

**Scaling Checklist:**

- [ ] Load balancer (nginx, HAProxy, or cloud LB)
- [ ] Database read replicas
- [ ] Caching layer (Redis)
- [ ] CDN for static assets
- [ ] Horizontal scaling (multiple server instances)
- [ ] Database connection pooling
- [ ] Query optimization & indexing
- [ ] Monitoring & alerting
- [ ] Auto-scaling based on metrics
- [ ] Database sharding (if needed)

---

## Production Deployment

### Q: What's the difference between development and production configurations?

**A:**

```typescript
// .env.development
NODE_ENV=development
PORT=3001
TICKETMASTER_API_KEY=test_key
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:3000

// .env.production
NODE_ENV=production
PORT=8080
TICKETMASTER_API_KEY=prod_key_from_secrets_manager
REDIS_URL=redis://redis-prod.aws.com:6379
LOG_LEVEL=info
CORS_ORIGINS=https://eventfinder.com
DB_POOL_SIZE=50
RATE_LIMIT_WINDOW=1m
RATE_LIMIT_MAX=100
```

**Environment-Specific Configuration:**

```typescript
const config = {
  development: {
    logLevel: 'debug',
    cacheTTL: 5 * 60, // 5 minutes
    rateLimit: { window: '15m', max: 1000 },
    corsOrigins: ['http://localhost:3000'],
  },
  production: {
    logLevel: 'info',
    cacheTTL: 60 * 60, // 1 hour
    rateLimit: { window: '15m', max: 100 },
    corsOrigins: ['https://eventfinder.com'],
  },
};

export default config[process.env.NODE_ENV || 'development'];
```

**Docker Deployment:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node healthcheck.js

EXPOSE 3001

CMD ["npm", "start"]
```

---

## Performance Metrics & Monitoring

### Q: What metrics should we track?

**A:**

```typescript
// Key Performance Indicators (KPIs)
const metrics = {
  // Response Time
  'api.events.search.response_time': 'ms', // Target: <500ms
  'api.cities.search.response_time': 'ms', // Target: <200ms

  // Throughput
  'api.requests.per_second': 'count',
  'api.events.search.requests_per_minute': 'count',

  // Error Rates
  'api.errors.rate': '%', // Target: <0.5%
  'api.5xx_errors': 'count',
  'api.4xx_errors': 'count',

  // Cache Performance
  'cache.hit_rate': '%', // Target: >80%
  'cache.miss_rate': '%',

  // External API
  'ticketmaster.response_time': 'ms',
  'ticketmaster.error_rate': '%',

  // Database
  'db.query_time': 'ms',
  'db.connection_pool.active': 'count',
  'db.connection_pool.idle': 'count',

  // Business
  'events.total_found': 'count',
  'search.avg_results': 'count',
};

// Implementation with Prometheus
import prom from 'prom-client';

const searchResponseTime = new prom.Histogram({
  name: 'api_events_search_response_time_ms',
  help: 'Response time for event search',
  buckets: [100, 250, 500, 1000, 2000, 5000],
});

const cacheHitRate = new prom.Counter({
  name: 'api_cache_hits_total',
  help: 'Total cache hits',
});

app.get('/api/events/search', (req, res) => {
  const timer = searchResponseTime.startTimer();

  try {
    // ... search logic
    cacheHitRate.inc();
  } finally {
    timer();
  }
});

// Prometheus endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prom.register.contentType);
  res.end(prom.register.metrics());
});
```

---

## Summary: Production Checklist

- [ ] **Security**: HTTPS, API keys, input validation, CORS, helmet, sanitization
- [ ] **Performance**: Caching (Redis), database indexing, connection pooling, CDN
- [ ] **Reliability**: Error handling, logging, monitoring, health checks
- [ ] **Scalability**: Load balancing, horizontal scaling, database sharding
- [ ] **Testing**: Unit, integration, load tests, mocking external APIs
- [ ] **Deployment**: Docker, environment configs, CI/CD pipelines
- [ ] **Observability**: Metrics, logs, traces, alerts
- [ ] **Documentation**: API docs (Swagger/OpenAPI), deployment guide, runbooks
