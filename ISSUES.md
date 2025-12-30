# GitHub Issues for Event Finder

This document contains all issues from the [kyeongan/event-finder](https://github.com/kyeongan/event-finder) repository.

## Open Issues (6)

### #15 - How would you scale this API to handle millions of requests?
**Status:** Open  
**Created:** 2025-12-27  
**Labels:** None

#### Description:
Q: How would you scale this API to handle millions of requests?

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

### #14 - cache with redis, implement caching? What strategy?
**Status:** Open  
**Created:** 2025-12-27  
**Updated:** 2025-12-29  
**Labels:** None

#### Description:
Currently, it has an in-memory cache with a time-to-live (TTL). I considered using Redis and analyzed its pros and cons to learn more about it.

---

### #13 - different error scenarios
**Status:** Open  
**Created:** 2025-12-27  
**Labels:** None

#### Description:
improve error handling with graceful message

| Status | Cause | Action |
|--------|-------|--------|
| 400 | Bad request (invalid params) | Client fixes request |
| 401 | Unauthorized (API key) | Server fixes config |
| 403 | Forbidden | Client not allowed |
| 404 | Not found | Client checks URL |
| 429 | Rate limited | Client waits & retries |
| 500 | Server error | Server logs & fixes |
| 503 | Service unavailable | Client retries later |

---

### #12 - multiple data sources (not just Ticketmaster)
**Status:** Open  
**Created:** 2025-12-27  
**Labels:** None

#### Description:
(No description provided)

---

### #5 - api hardening
**Status:** Open  
**Created:** 2025-12-22  
**Labels:** None

#### Description:
(No description provided)

---

### #1 - pagination backend
**Status:** Open  
**Created:** 2025-12-19  
**Labels:** `enhancement`

#### Description:
pagination backend + ticket master api

---

## Closed Issues (4)

### #10 - update search form - replace the current flow to ticket master style
**Status:** Closed  
**Created:** 2025-12-25  
**Closed:** 2025-12-25  
**Labels:** None

#### Description:
(No description provided)

---

### #4 - POST method for fetching
**Status:** Closed  
**Created:** 2025-12-21  
**Closed:** 2025-12-27  
**Labels:** None

#### Description:
Replace current query parameters with request body

---

### #3 - Improve Local storage
**Status:** Closed  
**Created:** 2025-12-21  
**Closed:** 2025-12-25  
**Labels:** `bug`, `enhancement`

#### Description:
Refine local storage. Currently refreshing a browser doesn't rehydrate local storage. 
Only it works between questions.

---

### #2 - In memory cache
**Status:** Closed  
**Created:** 2025-12-21  
**Closed:** 2025-12-25  
**Labels:** None

#### Description:
In memory cache
- simple map check whether key is stored

---

## Summary

- **Total Issues:** 10
- **Open Issues:** 6
- **Closed Issues:** 4

### Categories

**Performance & Scalability:**
- #15 - API scaling strategies
- #14 - Redis caching implementation
- #1 - Pagination backend

**Error Handling:**
- #13 - Different error scenarios

**Features:**
- #12 - Multiple data sources
- #5 - API hardening

**Completed:**
- #10 - Search form update
- #4 - POST method implementation
- #3 - Local storage improvements
- #2 - In-memory cache

---

_Last updated: 2025-12-30_
