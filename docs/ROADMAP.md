# Finance Interceptor - Development Roadmap

## Current Status: Phase 4 Complete ✅
- ✅ Phase 1 Complete (Auth + Secrets Management)
- ✅ Phase 2 Complete (Webhooks + Transaction Sync)
- ✅ Phase 3 Complete (Core Features)
- ✅ Phase 4 Complete (Recurring Detection Engine)

---

## Phase 1: Foundation (Database + Auth) ✅

### 1.1 Database Setup ✅
### 1.2 Backend Auth Infrastructure ✅
### 1.3 User Authentication (Mobile) ✅
### 1.4 Secrets Management ✅

**Deliverable:** Users can sign up, log in, and connect bank accounts with tokens stored securely. ✅

---

## Phase 2: Data Sync Infrastructure ✅

### 2.1 Plaid Webhook Integration ✅
### 2.2 Transaction Sync ✅

**Deliverable:** Transactions sync automatically via webhooks. ✅

---

## Phase 3: Core Features ✅

### 3.1 Account Management API ✅
- [x] GET /api/accounts - List user's connected accounts
- [x] GET /api/accounts/:id - Get account details
- [x] POST /api/accounts/:id/sync - Force manual sync
- [x] DELETE /api/accounts/plaid-items/:id - Disconnect a plaid item

### 3.2 Transaction API ✅
- [x] GET /api/transactions - List transactions (paginated, filtered)
- [x] GET /api/transactions/:id - Get transaction details
- [x] Implement date range filtering
- [x] Implement category filtering
- [x] Implement search by merchant name

### 3.3 Mobile App - Account Views ✅
- [x] Account list screen with total balance
- [x] Account cards grouped by institution
- [x] Transaction list screen with infinite scroll
- [x] Transaction detail screen
- [x] Pull-to-refresh functionality
- [x] Loading and empty states

### 3.4 UI Redesign ✅
- [x] Dark theme with glassmorphism
- [x] i18n internationalization support
- [x] Simplified navigation (Activity | Home)
- [x] Profile menu (Accounts, Settings, Sign Out)
- [x] Net Worth calculation (assets - liabilities)

**Deliverable:** Users can view all their accounts and transactions in the app. ✅

---

## Phase 4: Recurring Detection Engine (Using Plaid API)

### 4.1 Database & Models ✅
- [x] Create enum types (StreamType, FrequencyType, StreamStatus, AlertType, etc.)
- [x] Create recurring_streams table
- [x] Create alerts table (new schema)
- [x] Create Pydantic models
- [x] Update schema.sql
- [x] Create migration file

### 4.2 Repositories ✅
- [x] RecurringStreamRepository
- [x] AlertRepository

### 4.3 Services ✅
- [x] Add `get_recurring_transactions()` to PlaidService
- [x] Create PriceSensitivityService (category-aware thresholds)
- [x] Create AlertDetectionService
- [x] Create RecurringSyncService

### 4.4 API & Webhooks ✅
- [x] Create recurring router
- [x] Create alerts router
- [x] Add RECURRING_TRANSACTIONS_UPDATE webhook handler

### 4.5 Mobile App ✅
- [x] TypeScript types
- [x] API services
- [x] Hooks (useRecurring, useAlerts)
- [x] Recurring list screen
- [x] Alerts screen

**Deliverable:** System automatically detects subscriptions and price changes using Plaid's Recurring Transactions API. ✅

---

## Phase 5: Alert System

### 5.1 Alert Infrastructure
- [ ] Push notification setup (Expo)
- [ ] Backend notification service
- [ ] User notification preferences

### 5.2 Mobile App - Pulse Feed
- [ ] Alert feed screen (replaces Home as primary)
- [ ] Alert cards with actions (dismiss, view details)
- [ ] Alert history

**Deliverable:** Users receive push notifications for price changes.

---

## Phase 6: Agentic Features

### 6.1 AI Assistant
- [ ] Chat interface (FAB button)
- [ ] Natural language queries ("How much did I spend on Uber last month?")
- [ ] LLM integration (OpenAI/Anthropic)

### 6.2 Proactive Insights
- [ ] Lifestyle creep detection (baseline spending increase)
- [ ] Spending anomaly detection
- [ ] Budget recommendations

**Deliverable:** AI-powered financial assistant.

---

## Phase 7: Production Hardening

### 7.1 Security
- [ ] Rate limiting
- [ ] Input validation audit
- [ ] Security headers
- [ ] Penetration testing

### 7.2 Performance
- [ ] Database indexing optimization
- [ ] API response caching
- [ ] Background job queue (Celery/Temporal)

### 7.3 Monitoring
- [ ] Error tracking (Sentry)
- [ ] APM (Application Performance Monitoring)
- [ ] Logging infrastructure

### 7.4 Deployment
- [ ] CI/CD pipeline
- [ ] Staging environment
- [ ] Production infrastructure

**Deliverable:** Production-ready application.

---

## Future Considerations

### Investment Portfolio Support
Plaid's Investments product uses a separate API (`/investments/transactions/get`, `/investments/holdings/get`) with a different schema than regular transactions. This would require:

- [ ] Add `investments` to Plaid products in link token creation
- [ ] New database tables: `securities`, `holdings`, `investment_transactions`
- [ ] New API endpoints: `/api/investments/holdings`, `/api/investments/transactions`
- [ ] New mobile screens: Portfolio view, Investment transaction history
- [ ] Holdings breakdown by asset class
- [ ] Performance tracking (gains/losses)

**Note:** Investment account balances are already included in Net Worth calculation. This feature would add transaction-level detail for investment accounts (buy/sell/dividend activity).

### Additional Future Features
- [ ] Bill calendar view
- [ ] Spending categories breakdown
- [ ] Multi-currency support
- [ ] Export to CSV/PDF
- [ ] Shared accounts (family/couples)
- [ ] Light mode theme

---

## Milestones

| Milestone | Status |
|-----------|--------|
| POC - Plaid Auth | ✅ Complete |
| Phase 1 - Foundation | ✅ Complete |
| Phase 2 - Data Sync | ✅ Complete |
| Phase 3 - Core Features | ✅ Complete |
| Phase 4 - Recurring Detection | ✅ Complete |
| Phase 5 - Alerts | Not Started |
| Phase 6 - Agentic | Not Started |
| Phase 7 - Production | Not Started |
