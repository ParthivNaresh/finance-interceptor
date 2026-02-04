# Finance Interceptor - Development Roadmap

## Current Status: Phase 3 Complete ✅
- ✅ Phase 1 Complete (Auth + Secrets Management)
- ✅ Phase 2 Complete (Webhooks + Transaction Sync)
- ✅ Phase 3 Complete (Core Features)
- 🚧 Phase 4: Recurring Detection Engine

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

**Deliverable:** Users can view all their accounts and transactions in the app. ✅

---

## Phase 4: Recurring Detection Engine

### 4.1 Merchant Normalization
- [ ] Implement basic normalization rules
- [ ] Use Plaid's merchant_name and personal_finance_category
- [ ] Build canonical merchant lookup service

### 4.2 Recurring Transaction Detection
- [ ] Implement frequency detection algorithm
- [ ] Detect subscription patterns from transaction history
- [ ] Create recurring_transactions records
- [ ] Track expected amounts and dates

### 4.3 Price Change Detection
- [ ] Compare new transactions to expected recurring amounts
- [ ] Calculate percentage change
- [ ] Create alerts when threshold exceeded

**Deliverable:** System automatically detects subscriptions and price changes.

---

## Phase 5: Alert System

### 5.1 Alert Infrastructure
### 5.2 Push Notifications
### 5.3 Mobile App - Alerts

**Deliverable:** Users receive push notifications for price changes.

---

## Phase 6: Agentic Features (Future)
## Phase 7: Production Hardening

---

## Milestones

| Milestone | Status |
|-----------|--------|
| POC - Plaid Auth | ✅ Complete |
| Phase 1 - Foundation | ✅ Complete |
| Phase 2 - Data Sync | ✅ Complete |
| Phase 3 - Core Features | ✅ Complete |
| Phase 4 - Recurring Detection | 🚧 Next |
| Phase 5 - Alerts | Not Started |
| Phase 6 - Agentic | Not Started |
| Phase 7 - Production | Not Started |
