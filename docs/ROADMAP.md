# Finance Interceptor - Development Roadmap

## Current Status: Phase 1 Complete ✅
- ✅ Plaid Link integration working
- ✅ Public token → access token exchange working
- ✅ Basic FastAPI backend structure
- ✅ Supabase project created
- ✅ Database schema deployed
- ✅ Backend auth middleware implemented
- ✅ Mobile auth integration complete
- ✅ Full auth flow tested
- ✅ Secrets management (encrypted token storage)

---

## Phase 1: Foundation (Database + Auth) ✅

### 1.1 Database Setup ✅
- [x] Set up Supabase project (Postgres + Auth)
- [x] Create database schema (see schema.sql)
- [x] Configure Row Level Security (RLS) policies
- [x] Enable pgvector extension for future merchant matching
- [x] Set up connection pooling (Supabase handles this)

### 1.2 Backend Auth Infrastructure ✅
- [x] Create DatabaseService (Supabase client wrapper)
- [x] Add Supabase config to Settings
- [x] Create AuthService (token validation via Supabase)
- [x] Create auth middleware (get_current_user, get_optional_user)
- [x] Reorganize models into directory structure

### 1.3 User Authentication (Mobile) ✅
- [x] Install Supabase JS client
- [x] Create Supabase service module
- [x] Create AuthContext provider
- [x] Create useAuth hook
- [x] Create login screen
- [x] Create register screen
- [x] Update API client to include JWT
- [x] Add auth state to app layout
- [x] Refactor styles into features/ directory
- [x] Test full auth flow

### 1.4 Secrets Management ✅
- [x] Create EncryptionService for token encryption
- [x] Create PlaidItemRepository for plaid_items CRUD
- [x] Create AccountRepository for accounts CRUD
- [x] Update PlaidService to fetch accounts after connection
- [x] Update exchange-token endpoint to:
  - Require authentication
  - Encrypt and store access_token
  - Create plaid_items record
  - Fetch and store accounts from Plaid
  - Return connected accounts to mobile
- [x] Update mobile to display connected accounts
- [x] Test full connection flow with data persistence

**Deliverable:** Users can sign up, log in, and connect bank accounts with tokens stored securely. ✅

---

## Phase 2: Data Sync Infrastructure

### 2.1 Plaid Webhook Integration
- [ ] Create webhook endpoint with signature validation
- [ ] Implement webhook event storage (idempotency)
- [ ] Handle SYNC_UPDATES_AVAILABLE webhook
- [ ] Handle ITEM error webhooks (LOGIN_REQUIRED, etc.)
- [ ] Set up webhook URL in Plaid dashboard

### 2.2 Task Queue Setup (Temporal)
- [ ] Set up Temporal server (or Temporal Cloud)
- [ ] Create Python Temporal worker
- [ ] Implement initial sync workflow
- [ ] Implement incremental sync workflow
- [ ] Implement balance refresh workflow

### 2.3 Transaction Sync
- [ ] Implement /transactions/sync API integration
- [ ] Store transactions with proper deduplication
- [ ] Handle transaction modifications and removals
- [ ] Store sync cursors per item
- [ ] Implement daily scheduled balance refresh

**Deliverable:** Transactions sync automatically via webhooks and scheduled jobs.

---

## Phase 3: Core Features

### 3.1 Account Management API
- [ ] GET /api/accounts - List user's connected accounts
- [ ] GET /api/accounts/:id - Get account details
- [ ] DELETE /api/accounts/:id - Disconnect account (remove from Plaid + delete data)
- [ ] POST /api/accounts/:id/sync - Force manual sync

### 3.2 Transaction API
- [ ] GET /api/transactions - List transactions (paginated, filtered)
- [ ] GET /api/transactions/:id - Get transaction details
- [ ] Implement date range filtering
- [ ] Implement category filtering
- [ ] Implement search by merchant name

### 3.3 Mobile App - Account Views
- [ ] Account list screen
- [ ] Account detail screen with balance
- [ ] Transaction list screen
- [ ] Transaction detail screen
- [ ] Pull-to-refresh functionality
- [ ] Connection status indicators

**Deliverable:** Users can view all their accounts and transactions in the app.

---

## Phase 4: Recurring Detection Engine

### 4.1 Merchant Normalization
- [ ] Create merchant_aliases table
- [ ] Implement basic normalization rules (lowercase, trim, common patterns)
- [ ] Use Plaid's merchant_name and personal_finance_category
- [ ] Build canonical merchant lookup service
- [ ] (Future) Add pgvector embeddings for fuzzy matching

### 4.2 Recurring Transaction Detection
- [ ] Implement frequency detection algorithm (weekly, monthly, annual)
- [ ] Detect subscription patterns from transaction history
- [ ] Create recurring_transactions records
- [ ] Track expected amounts and dates
- [ ] Handle variable amounts (utilities, usage-based)

### 4.3 Price Change Detection
- [ ] Compare new transactions to expected recurring amounts
- [ ] Calculate percentage change
- [ ] Create alerts when threshold exceeded (default: 5%)
- [ ] Store price change history

**Deliverable:** System automatically detects subscriptions and price changes.

---

## Phase 5: Alert System

### 5.1 Alert Infrastructure
- [ ] Create alerts table and API
- [ ] GET /api/alerts - List user's alerts
- [ ] POST /api/alerts/:id/dismiss - Dismiss alert
- [ ] POST /api/alerts/:id/snooze - Snooze alert
- [ ] Implement alert priority/severity levels

### 5.2 Push Notifications
- [ ] Set up Expo Push Notifications
- [ ] Create notification worker in Temporal
- [ ] Implement notification preferences (per alert type)
- [ ] Handle notification tokens (device registration)

### 5.3 Mobile App - Alerts
- [ ] Alerts list screen
- [ ] Alert detail screen with context
- [ ] Dismiss/snooze actions
- [ ] Notification permission flow
- [ ] Badge count on app icon

**Deliverable:** Users receive push notifications for price changes and can manage alerts.

---

## Phase 6: Agentic Features (Future)

### 6.1 Agent Decision Framework
- [ ] Create agent_decisions table for audit trail
- [ ] Implement decision logging service
- [ ] Store reasoning and confidence scores
- [ ] Build decision review UI

### 6.2 User Permission System
- [ ] Create user_agent_permissions table
- [ ] Implement permission management API
- [ ] Build permission settings UI
- [ ] Granular controls (read-only vs execute)

### 6.3 Cross-Account Analysis
- [ ] Weekly aggregation job for total recurring spend
- [ ] Detect "lifestyle creep" across all accounts
- [ ] Generate weekly/monthly spending summaries
- [ ] Trend analysis and projections

### 6.4 AI Integration
- [ ] Integrate LLM for natural language alerts
- [ ] Implement "Should I cancel?" recommendations
- [ ] Usage pattern analysis (app activity correlation)
- [ ] Personalized financial insights

**Deliverable:** Intelligent agent that proactively manages user's subscriptions.

---

## Phase 7: Production Hardening

### 7.1 Security
- [ ] Security audit of all endpoints
- [ ] Rate limiting implementation (Redis)
- [ ] Input validation review
- [ ] CORS configuration (remove allow_origins=["*"])
- [ ] API key rotation strategy

### 7.2 Monitoring & Observability
- [ ] Set up error tracking (Sentry)
- [ ] Implement structured logging
- [ ] Create health check dashboard
- [ ] Set up alerting for system issues

### 7.3 Performance
- [ ] Database query optimization
- [ ] Add database indexes
- [ ] Implement response caching where appropriate
- [ ] Load testing

### 7.4 Compliance
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Data retention policies
- [ ] User data export/deletion (GDPR/CCPA)

**Deliverable:** Production-ready application.

---

## Database Schema

See `docs/schema.sql` for complete schema.

---

## Technology Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Database | Supabase (Postgres) | Managed, includes Auth + Realtime |
| Auth | Supabase Auth | Integrated with DB, JWT-based |
| Secrets | Application-level encryption | Fernet (AES) via cryptography library |
| Task Queue | Temporal | Best for long-running agentic workflows |
| Cache | Redis (Upstash) | Rate limiting, idempotency keys |
| Push | Expo Push | Native to our mobile stack |
| Vector Search | pgvector | Already in Postgres, no extra service |

---

## Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| POC - Plaid Auth | ✅ | Complete |
| Phase 1 - Foundation | ✅ | Complete |
| Phase 2 - Data Sync | | Not Started |
| Phase 3 - Core Features | | Not Started |
| Phase 4 - Recurring Detection | | Not Started |
| Phase 5 - Alerts | | Not Started |
| Phase 6 - Agentic | | Not Started |
| Phase 7 - Production | | Not Started |
| v1.0 Release | | Not Started |
