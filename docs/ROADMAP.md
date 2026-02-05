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

## Phase 4: Recurring Detection Engine (Using Plaid API) ✅

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
- [x] Recurring detail screen with transaction history

**Deliverable:** System automatically detects subscriptions and price changes using Plaid's Recurring Transactions API. ✅

---

## Phase 5: Analytics Engine

Pre-computed, rule-based analytics stored in Supabase. Provides structured insights for users and future AI agents without LLM costs.

### 5.1 Database Schema ✅
- [x] `spending_periods` table (daily/weekly/monthly/yearly rollups)
- [x] `category_spending` table (spending by category per period)
- [x] `merchant_spending` table (spending by merchant per month)
- [x] `merchant_stats` table (lifetime merchant statistics)
- [x] `cash_flow_metrics` table (income, expenses, net flow, savings rate)
- [x] `lifestyle_baselines` table (baseline spending per category)
- [x] `lifestyle_creep_scores` table (monthly creep tracking)
- [x] `transaction_anomalies` table (flagged unusual transactions)
- [x] `income_sources` table (detected income streams)
- [x] `analytics_computation_log` table (computation state tracking)
- [x] New enum types (period_type, baseline_type, anomaly_type, etc.)
- [x] Added `is_internal_transfer` to transactions table

### 5.2 Spending Aggregations
- [ ] Monthly spend by category
- [ ] Monthly spend by merchant
- [ ] Month-over-month deltas (% change)
- [ ] Rolling averages (3mo, 6mo, 12mo)
- [ ] Incremental recomputation on new transactions

### 5.3 Merchant Intelligence
- [ ] Transaction frequency per merchant
- [ ] Average transaction size per merchant
- [ ] First/last transaction dates
- [ ] Total lifetime spend per merchant
- [ ] Merchant categorization cleanup

### 5.4 Cash Flow Analysis
- [ ] Income detection (large recurring inflows)
- [ ] Monthly net cash flow
- [ ] Burn rate calculation (days until $0)
- [ ] Savings rate ((income - expenses) / income)
- [ ] Projected balance forecasting

### 5.5 Anomaly Detection (Rule-Based)
- [ ] Unusually large transactions (>2σ from merchant mean)
- [ ] New merchant flags (first-time spend)
- [ ] Category spikes (>50% above rolling average)
- [ ] Duplicate transaction detection

### 5.6 Lifestyle Creep Scoring
- [ ] Establish baseline spending (first 3 months per category)
- [ ] Current vs baseline delta calculation
- [ ] Creep score per category
- [ ] Overall lifestyle creep index

### 5.7 API Endpoints
- [ ] GET /api/analytics/spending - Spending summaries
- [ ] GET /api/analytics/merchants - Merchant intelligence
- [ ] GET /api/analytics/cash-flow - Cash flow metrics
- [ ] GET /api/analytics/anomalies - Flagged transactions
- [ ] GET /api/analytics/lifestyle-creep - Creep scores

### 5.8 Mobile App - Insights Dashboard
- [ ] Spending breakdown by category (charts)
- [ ] Top merchants list
- [ ] Cash flow summary card
- [ ] Anomaly notifications
- [ ] Lifestyle creep indicators

**Deliverable:** Pre-computed financial insights stored in Supabase, accessible via API and displayed in app.

---

## Phase 6: Push Notifications & Alerts

### 6.1 Alert Infrastructure
- [ ] Push notification setup (Expo)
- [ ] Backend notification service
- [ ] User notification preferences

### 6.2 Mobile App - Alert Feed
- [ ] Alert feed screen
- [ ] Alert cards with actions (dismiss, view details)
- [ ] Alert history
- [ ] Badge counts on tab bar

### 6.3 Smart Alerts (Using Analytics)
- [ ] Price increase alerts (existing)
- [ ] Spending spike alerts (from anomaly detection)
- [ ] Lifestyle creep warnings
- [ ] Low balance warnings
- [ ] Unusual merchant alerts

**Deliverable:** Users receive push notifications for price changes, spending anomalies, and financial insights.

---

## Phase 7: Agentic Features

### 7.1 Merchant Normalization
- [ ] Fallback normalization when Plaid's merchant_name is null
- [ ] Merchant entity resolution (deduplicate similar merchants)
- [ ] User-defined merchant aliases
- [ ] Merchant logo/icon fallback service

### 7.2 AI Assistant
- [ ] Chat interface (FAB button)
- [ ] Natural language queries ("How much did I spend on Uber last month?")
- [ ] LLM integration (OpenAI/Anthropic)
- [ ] Context injection from analytics layer

### 7.3 Proactive Insights
- [ ] AI-generated spending summaries
- [ ] Personalized budget recommendations
- [ ] Subscription optimization suggestions
- [ ] Savings opportunity detection

**Deliverable:** AI-powered financial assistant leveraging pre-computed analytics.

---

## Phase 8: Production Hardening

### 8.1 Security
- [ ] Rate limiting
- [ ] Input validation audit
- [ ] Security headers
- [ ] Penetration testing

### 8.2 Performance
- [ ] Database indexing optimization
- [ ] API response caching
- [ ] Background job queue (Celery/Temporal)
- [ ] Analytics computation scheduling

### 8.3 Monitoring
- [ ] Error tracking (Sentry)
- [ ] APM (Application Performance Monitoring)
- [ ] Logging infrastructure

### 8.4 Deployment
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
| Phase 5 - Analytics Engine | Not Started |
| Phase 6 - Push Notifications | Not Started |
| Phase 7 - Agentic | Not Started |
| Phase 8 - Production | Not Started |
