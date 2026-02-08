# Finance Interceptor - Development Roadmap

## Current Status: Phase 5.6.1 Complete
- ✅ Phase 1 Complete (Auth + Secrets Management)
- ✅ Phase 2 Complete (Webhooks + Transaction Sync)
- ✅ Phase 3 Complete (Core Features)
- ✅ Phase 4 Complete (Recurring Detection Engine)
- 🔄 Phase 5 In Progress (Analytics Engine - 5.6.1 done)

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
### 3.2 Transaction API ✅
### 3.3 Mobile App - Account Views ✅
### 3.4 UI Redesign ✅

**Deliverable:** Users can view all their accounts and transactions in the app. ✅

---

## Phase 4: Recurring Detection Engine ✅

### 4.1-4.5 Complete ✅

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
- [x] Migration: `docs/migrations/005_analytics_engine.sql`

### 5.2 Spending Aggregations ✅
- [x] Backend models (`models/analytics.py`)
- [x] Repositories (spending_period, category_spending, merchant_spending, analytics_log)
- [x] Services (`services/analytics/` package)
  - `period_calculator.py` - Date/period utilities
  - `transfer_detector.py` - Internal transfer detection
  - `spending_aggregator.py` - Metrics computation
  - `computation_manager.py` - Orchestration
- [x] API Router (`routers/analytics.py`)
  - GET /api/analytics/spending - Spending summaries with MoM changes
  - GET /api/analytics/spending/current - Current period details
  - GET /api/analytics/spending/categories - Category breakdown
  - GET /api/analytics/spending/merchants - Merchant breakdown
  - GET /api/analytics/spending/category/{category} - Category history
  - GET /api/analytics/spending/merchant/{merchant_name} - Merchant history
  - POST /api/analytics/compute - Trigger computation
- [x] Webhook integration (auto-compute after transaction sync)
- [x] Mobile types (`types/analytics.ts`)
- [x] Mobile API service (`services/api/analytics.ts`)
- [x] Mobile hooks (`hooks/useAnalytics.ts`)
- [x] Mobile components (`components/analytics/`)
  - SpendingCard, ChangeIndicator, CategoryItem, MerchantItem, SectionHeader
- [x] Mobile Insights screen (`app/(tabs)/insights.tsx`)
- [x] Tab navigation updated with Insights tab

### 5.3 Merchant Intelligence ✅
- [x] Transaction frequency per merchant
- [x] Average transaction size per merchant
- [x] First/last transaction dates
- [x] Total lifetime spend per merchant
- [x] Merchant categorization cleanup
- [x] Backend service (`services/analytics/merchant_stats_aggregator.py`)
- [x] Repository (`repositories/merchant_stats.py`)
- [x] API endpoints:
  - GET /api/analytics/merchants/stats - All merchant stats
  - GET /api/analytics/merchants/stats/top - Top merchants by spend/frequency
  - GET /api/analytics/merchants/stats/recurring - Recurring merchants
  - GET /api/analytics/merchants/stats/{name} - Single merchant detail
  - POST /api/analytics/merchants/stats/compute - Trigger computation
- [x] Mobile hooks (`hooks/analytics/useMerchants.ts`)

### 5.4 Cash Flow Analysis ✅
- [x] Income detection (large recurring inflows)
- [x] Monthly net cash flow
- [x] Savings rate ((income - expenses) / income)
- [x] Backend services:
  - `services/analytics/cash_flow_aggregator.py`
  - `services/analytics/income_detector.py`
- [x] Repositories:
  - `repositories/cash_flow_metrics.py`
  - `repositories/income_source.py`
- [x] API endpoints:
  - GET /api/analytics/cash-flow - Cash flow metrics history
  - GET /api/analytics/cash-flow/current - Current month cash flow
  - GET /api/analytics/income-sources - Detected income sources
  - POST /api/analytics/cash-flow/compute - Trigger computation
- [x] Mobile hooks (`hooks/analytics/useCashFlow.ts`)
- [ ] Burn rate calculation (days until $0) - Future enhancement
- [ ] Projected balance forecasting - Future enhancement

### 5.5 Anomaly Detection (Rule-Based)
- [ ] Unusually large transactions (>2σ from merchant mean)
- [ ] New merchant flags (first-time spend)
- [ ] Category spikes (>50% above rolling average)
- [ ] Duplicate transaction detection

### 5.6 Lifestyle Creep Scoring ✅
- [x] Establish baseline spending (first 3 months per category)
- [x] Current vs baseline delta calculation
- [x] Creep score per category
- [x] Overall lifestyle creep index
- [x] Seasonality detection (reduces severity for expected seasonal spending)
- [x] Backend services (`services/analytics/baseline_calculator.py`, `creep_scorer.py`, `seasonality_detector.py`)
- [x] Repositories (`repositories/lifestyle_baseline.py`, `lifestyle_creep_score.py`)
- [x] API endpoints (11 endpoints under `/api/analytics/lifestyle-creep/`)
  - GET /pacing - Real-time spending pacing status
  - GET /target-status - Target establishment status (building/established)
  - GET /baselines - Get user's lifestyle baselines
  - POST /baselines/compute - Compute baselines from historical data
  - POST /baselines/lock - Lock baselines to preserve reference point
  - POST /baselines/unlock - Unlock baselines for recomputation
  - POST /baselines/reset - Delete and recompute baselines
  - GET /summary - Get creep summary for a period
  - GET /history - Get creep summaries for multiple periods
  - GET /category/{name} - Get creep history for specific category
  - POST /compute - Compute creep scores for multiple periods
  - POST /compute/current - Compute creep scores for current period only
- [x] Mobile types (17 new types in `types/analytics.ts`)
- [x] Mobile API service (12 new methods in `services/api/analytics.ts`)
- [x] Mobile hooks (`hooks/analytics/useLifestyleCreep.ts`, `usePacing.ts`, `useTargetStatus.ts`)
  - useLifestyleBaselines, useLifestyleCreepSummary, useLifestyleCreepHistory
  - useCategoryCreepHistory, useBaselineComputation, useCreepComputation
  - usePacing, useTargetStatus
- [x] Utility functions (getCreepSeverityColor, getCreepSeverityLabel, formatPercentageChange)

### 5.6.1 Real-Time Pacing Mode ✅
- [x] Pacing API endpoint (`GET /api/analytics/lifestyle-creep/pacing`)
- [x] Three display modes based on day of month:
  - **Kickoff** (Days 1-3): "New month!" with target and current spend
  - **Pacing** (Days 4-7): Progress bar with "today" marker
  - **Stability** (Days 8+): Full stability score + pacing + top drifting category
- [x] Pacing status labels:
  - "Behind" → "Spending slower than usual" (green, positive)
  - "On Track" → "On pace with your target" (teal, neutral)
  - "Ahead" → "Spending faster than usual" (warning)
- [x] Backend `get_pacing_status()` method in `CreepScorer`
- [x] Mobile `usePacing` hook
- [x] `SpendingStabilityCard` component with all three modes
- [x] Minimum 4px progress bar fill for 0% visibility

### 5.7 Mobile App - Insights Dashboard Enhancements
- [ ] Spending trend chart (bar chart over time)
- [x] Category detail screens (`app/categories/[name].tsx`)
- [x] Merchant detail screens (`app/merchants/[name].tsx`)
- [ ] Period selector component
- [ ] Cash flow dashboard screen

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
- [x] Rate limiting (slowapi + Redis, per-user/IP limits)
- [x] Webhook signature verification (ES256 JWT, Plaid JWK)
- [x] Encryption upgrade (Argon2id KDF, per-encryption random salt)
- [x] Auth error handling (RFC 7235 compliant WWW-Authenticate headers)
- [x] Production safety defaults (debug=false, startup validation for production config)
- [ ] Input validation audit
- [ ] Security headers (CORS configured, CSP/X-Frame-Options pending)
- [ ] Penetration testing
- [x] Environment-based secrets (mobile credentials moved from app.json to .env)

### 8.2 Performance
- [ ] Database indexing optimization
- [ ] API response caching
- [x] Background job queue (ARQ + Redis)
- [x] Analytics computation debouncing (30s delay, prevents duplicate work)
- [ ] Analytics computation scheduling

### 8.3 Monitoring & Observability
- [x] Structured logging (structlog with JSON/console output)
- [x] Request logging middleware (correlation IDs, timing, status)
- [x] PII scrubbing in logs
- [x] Third-party log integration (uvicorn, httpx, supabase)
- [ ] Error tracking (Sentry)
- [ ] APM (Application Performance Monitoring)

### 8.4 Deployment
- [ ] CI/CD pipeline
- [ ] Staging environment
- [ ] Production infrastructure

**Deliverable:** Production-ready application.

---

## Future Considerations

### Investment Portfolio Support
Plaid's Investments product uses a separate API with a different schema. Would require new tables, endpoints, and screens.

### Additional Future Features
- [ ] Bill calendar view
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
| Phase 5 - Analytics Engine | 🔄 In Progress (5.6 done) |
| Phase 6 - Push Notifications | Not Started |
| Phase 7 - Agentic | Not Started |
| Phase 8 - Production | Not Started |
