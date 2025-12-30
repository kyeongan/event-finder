# GitHub Issues List

This document tracks all issues in the event-finder repository.

## 📋 Open Issues (6)

### #15 - How would you scale this API to handle millions of requests?
**Status**: Open  
**Created**: 2025-12-27  
**Author**: @kyeongan  
**Labels**: None

**Description**:
Explores scaling strategies for handling millions of requests, including:
- Load balancing with nginx
- Database connection pooling
- Caching strategy with Redis
- CDN for static content
- Horizontal scaling across multiple instances
- Database optimization (read replicas, sharding)
- Monitoring and alerting with Prometheus

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
**Status**: Open  
**Created**: 2025-12-27  
**Updated**: 2025-12-29  
**Author**: @kyeongan  
**Labels**: None

**Description**:
Currently has in-memory cache with TTL. Considering Redis implementation and analyzing pros/cons for caching strategy.

---

### #13 - different error scenarios
**Status**: Open  
**Created**: 2025-12-27  
**Author**: @kyeongan  
**Labels**: None

**Description**:
Improve error handling with graceful messages for different scenarios:

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
**Status**: Open  
**Created**: 2025-12-27  
**Author**: @kyeongan  
**Labels**: None

**Description**:
Expand beyond Ticketmaster to support multiple event data sources.

---

### #5 - api hardening
**Status**: Open  
**Created**: 2025-12-22  
**Author**: @kyeongan  
**Labels**: None

**Description**:
Improve API security and robustness.

---

### #1 - pagination backend
**Status**: Open  
**Created**: 2025-12-19  
**Author**: @kyeongan  
**Labels**: enhancement

**Description**:
Implement pagination backend with Ticketmaster API integration.

---

## ✅ Closed Issues (4)

### #10 - update search form - replace the current flow to ticket master style
**Status**: Closed  
**Created**: 2025-12-25  
**Closed**: 2025-12-25  
**Author**: @kyeongan  
**Labels**: None

**Description**:
Update search form to match Ticketmaster style.

---

### #4 - POST method for fetching
**Status**: Closed  
**Created**: 2025-12-21  
**Closed**: 2025-12-27  
**Author**: @kyeongan  
**Labels**: None

**Description**:
Replace current query parameters with request body using POST method.

---

### #3 - Improve Local storage
**Status**: Closed  
**Created**: 2025-12-21  
**Closed**: 2025-12-25  
**Author**: @kyeongan  
**Labels**: bug, enhancement

**Description**:
Refine local storage. Previously, refreshing browser didn't rehydrate local storage - only worked between questions. This has been fixed.

---

### #2 - In memory cache
**Status**: Closed  
**Created**: 2025-12-21  
**Closed**: 2025-12-25  
**Author**: @kyeongan  
**Labels**: None

**Description**:
Implement in-memory cache with simple map to check whether key is stored.

---

## 📊 Summary

- **Total Issues**: 10
- **Open**: 6 (60%)
- **Closed**: 4 (40%)

### Priority Areas

1. **Scalability** (#15, #14) - Planning for high-traffic scenarios
2. **Error Handling** (#13) - Better user experience during failures  
3. **API Improvements** (#5, #12) - Security and multi-source support
4. **Backend Features** (#1) - Pagination implementation

### Recent Activity

Most recent updates have focused on caching strategies, error handling improvements, and architectural considerations for scaling.
