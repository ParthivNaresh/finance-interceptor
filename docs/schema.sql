-- Finance Interceptor Database Schema
-- PostgreSQL with Supabase extensions
-- 
-- Run this in Supabase SQL Editor or psql
-- No migrations needed during development - drop and recreate as needed

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- For future merchant embeddings

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plaid Items (connected bank accounts)
CREATE TABLE public.plaid_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL UNIQUE,  -- Plaid's item_id
    institution_id TEXT,
    institution_name TEXT,
    institution_logo TEXT,  -- Base64 or URL
    access_token_ref UUID NOT NULL,  -- Reference to Vault secret
    status TEXT NOT NULL DEFAULT 'active',  -- active, login_required, error, disconnected
    error_code TEXT,
    error_message TEXT,
    consent_expiration_time TIMESTAMPTZ,
    last_successful_sync TIMESTAMPTZ,
    sync_cursor TEXT,  -- For /transactions/sync pagination
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plaid_items_user_id ON public.plaid_items(user_id);
CREATE INDEX idx_plaid_items_status ON public.plaid_items(status);

-- Bank Accounts
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plaid_item_id UUID NOT NULL REFERENCES public.plaid_items(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL UNIQUE,  -- Plaid's account_id
    name TEXT NOT NULL,
    official_name TEXT,
    type TEXT NOT NULL,  -- depository, credit, loan, investment, other
    subtype TEXT,  -- checking, savings, credit card, etc.
    mask TEXT,  -- Last 4 digits
    current_balance DECIMAL(19, 4),
    available_balance DECIMAL(19, 4),
    limit_amount DECIMAL(19, 4),  -- For credit cards
    iso_currency_code TEXT DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    balance_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_plaid_item_id ON public.accounts(plaid_item_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);

-- Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL UNIQUE,  -- Plaid's transaction_id
    amount DECIMAL(19, 4) NOT NULL,  -- Positive = money out, Negative = money in
    iso_currency_code TEXT DEFAULT 'USD',
    date DATE NOT NULL,
    datetime TIMESTAMPTZ,  -- If available from Plaid
    authorized_date DATE,
    authorized_datetime TIMESTAMPTZ,
    name TEXT NOT NULL,  -- Raw merchant name from Plaid
    merchant_name TEXT,  -- Cleaned merchant name from Plaid
    merchant_id UUID REFERENCES public.merchants(id),  -- Our canonical merchant
    payment_channel TEXT,  -- online, in store, other
    pending BOOLEAN NOT NULL DEFAULT FALSE,
    pending_transaction_id TEXT,
    
    -- Plaid categorization
    category_id TEXT,
    category TEXT[],  -- Plaid's category hierarchy
    personal_finance_category_primary TEXT,
    personal_finance_category_detailed TEXT,
    personal_finance_category_confidence TEXT,
    
    -- Location data (if available)
    location_address TEXT,
    location_city TEXT,
    location_region TEXT,
    location_postal_code TEXT,
    location_country TEXT,
    location_lat DECIMAL(10, 7),
    location_lon DECIMAL(10, 7),
    
    -- Metadata
    logo_url TEXT,
    website TEXT,
    check_number TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_merchant_id ON public.transactions(merchant_id);
CREATE INDEX idx_transactions_pending ON public.transactions(pending);
CREATE INDEX idx_transactions_account_date ON public.transactions(account_id, date DESC);

-- ============================================================================
-- MERCHANT NORMALIZATION
-- ============================================================================

-- Canonical Merchants
CREATE TABLE public.merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_name TEXT NOT NULL UNIQUE,  -- "Netflix", "Spotify", etc.
    display_name TEXT NOT NULL,
    category TEXT,  -- subscription, utility, retail, etc.
    logo_url TEXT,
    website TEXT,
    is_subscription BOOLEAN DEFAULT FALSE,
    typical_frequency TEXT,  -- monthly, annual, weekly
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merchants_canonical_name ON public.merchants(canonical_name);
CREATE INDEX idx_merchants_is_subscription ON public.merchants(is_subscription);

-- Merchant Aliases (for fuzzy matching)
CREATE TABLE public.merchant_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,  -- "NETFLIX.COM", "Netflix Inc", "SQ *NETFLIX"
    source TEXT NOT NULL DEFAULT 'manual',  -- manual, plaid, user_correction, ml
    confidence DECIMAL(3, 2) DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_merchant_aliases_alias ON public.merchant_aliases(LOWER(alias));
CREATE INDEX idx_merchant_aliases_merchant_id ON public.merchant_aliases(merchant_id);

-- Merchant Embeddings (for vector similarity search)
CREATE TABLE public.merchant_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    embedding vector(1536),  -- OpenAI ada-002 dimension
    model_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merchant_embeddings_merchant_id ON public.merchant_embeddings(merchant_id);

-- ============================================================================
-- RECURRING TRANSACTIONS & SUBSCRIPTIONS
-- ============================================================================

-- Detected Recurring Transactions
CREATE TABLE public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES public.merchants(id),
    merchant_pattern TEXT NOT NULL,  -- Normalized name or pattern
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    
    -- Pattern details
    frequency TEXT NOT NULL,  -- weekly, biweekly, monthly, quarterly, annual
    frequency_days INTEGER,  -- Average days between transactions
    expected_amount DECIMAL(19, 4) NOT NULL,
    amount_variance DECIMAL(19, 4),  -- How much the amount typically varies
    expected_day_of_month INTEGER,  -- For monthly subscriptions
    
    -- Tracking
    first_seen_date DATE NOT NULL,
    last_transaction_date DATE,
    last_transaction_amount DECIMAL(19, 4),
    next_expected_date DATE,
    transaction_count INTEGER NOT NULL DEFAULT 1,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active',  -- active, paused, cancelled, ended
    confidence_score DECIMAL(3, 2) NOT NULL DEFAULT 0.5,
    is_user_confirmed BOOLEAN DEFAULT FALSE,
    
    -- Price tracking
    initial_amount DECIMAL(19, 4),
    price_change_count INTEGER DEFAULT 0,
    total_price_change_percentage DECIMAL(5, 2) DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_user_id ON public.recurring_transactions(user_id);
CREATE INDEX idx_recurring_merchant_id ON public.recurring_transactions(merchant_id);
CREATE INDEX idx_recurring_status ON public.recurring_transactions(status);
CREATE INDEX idx_recurring_next_expected ON public.recurring_transactions(next_expected_date);

-- Price Change History
CREATE TABLE public.price_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recurring_transaction_id UUID NOT NULL REFERENCES public.recurring_transactions(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    previous_amount DECIMAL(19, 4) NOT NULL,
    new_amount DECIMAL(19, 4) NOT NULL,
    change_amount DECIMAL(19, 4) NOT NULL,
    change_percentage DECIMAL(5, 2) NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_changes_recurring_id ON public.price_changes(recurring_transaction_id);
CREATE INDEX idx_price_changes_detected_at ON public.price_changes(detected_at DESC);

-- ============================================================================
-- ALERTS & NOTIFICATIONS
-- ============================================================================

-- User Alerts
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,  -- price_increase, new_subscription, inactivity, connection_error, spending_spike
    severity TEXT NOT NULL DEFAULT 'info',  -- info, warning, critical
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    recurring_transaction_id UUID REFERENCES public.recurring_transactions(id) ON DELETE SET NULL,
    price_change_id UUID REFERENCES public.price_changes(id) ON DELETE SET NULL,
    plaid_item_id UUID REFERENCES public.plaid_items(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    
    -- Context data
    context JSONB,  -- Additional data for rendering the alert
    
    -- Status
    status TEXT NOT NULL DEFAULT 'unread',  -- unread, read, dismissed, snoozed, actioned
    snoozed_until TIMESTAMPTZ,
    action_taken TEXT,  -- What the user did (if any)
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    actioned_at TIMESTAMPTZ
);

CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_type ON public.alerts(type);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX idx_alerts_user_status ON public.alerts(user_id, status);

-- Notification Preferences
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,  -- price_increase, new_subscription, etc.
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    threshold_percentage DECIMAL(5, 2),  -- For price alerts, minimum % change
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, alert_type)
);

-- Push Notification Tokens
CREATE TABLE public.push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL,  -- ios, android
    device_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE UNIQUE INDEX idx_push_tokens_token ON public.push_tokens(token);

-- ============================================================================
-- AGENT & AUDIT
-- ============================================================================

-- Agent Decisions (Audit Trail)
CREATE TABLE public.agent_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    decision_type TEXT NOT NULL,  -- price_alert, inactivity_alert, cancel_suggestion, spending_warning
    
    -- What triggered the decision
    trigger_type TEXT NOT NULL,  -- transaction, scheduled_analysis, user_request
    trigger_entity_type TEXT,  -- transaction, recurring_transaction, account
    trigger_entity_id UUID,
    
    -- The decision
    input_data JSONB NOT NULL,  -- Data the agent used to make the decision
    reasoning JSONB NOT NULL,  -- Why the agent made this decision
    confidence_score DECIMAL(3, 2) NOT NULL,
    
    -- Outcome
    action_recommended TEXT,  -- alert, suggest_cancel, no_action
    action_taken TEXT,  -- What actually happened
    alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
    
    -- Timing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    user_responded_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_decisions_user_id ON public.agent_decisions(user_id);
CREATE INDEX idx_agent_decisions_type ON public.agent_decisions(decision_type);
CREATE INDEX idx_agent_decisions_created_at ON public.agent_decisions(created_at DESC);

-- User Agent Permissions
CREATE TABLE public.user_agent_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    permission_type TEXT NOT NULL,  -- read_transactions, send_alerts, suggest_actions, execute_actions
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    scope JSONB,  -- Optional: limit to specific accounts, merchants, etc.
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE(user_id, permission_type)
);

CREATE INDEX idx_user_agent_permissions_user_id ON public.user_agent_permissions(user_id);

-- ============================================================================
-- WEBHOOKS & SYSTEM
-- ============================================================================

-- Webhook Events (for idempotency and debugging)
CREATE TABLE public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_type TEXT NOT NULL,  -- TRANSACTIONS, ITEM, AUTH, ASSETS
    webhook_code TEXT NOT NULL,  -- SYNC_UPDATES_AVAILABLE, ERROR, etc.
    item_id TEXT,
    plaid_item_id UUID REFERENCES public.plaid_items(id) ON DELETE SET NULL,
    
    -- Payload
    payload JSONB NOT NULL,
    
    -- Processing
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, processed, failed
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    
    -- Timing
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Idempotency
    idempotency_key TEXT UNIQUE  -- Plaid webhook_id or generated
);

CREATE INDEX idx_webhook_events_status ON public.webhook_events(status);
CREATE INDEX idx_webhook_events_item_id ON public.webhook_events(item_id);
CREATE INDEX idx_webhook_events_received_at ON public.webhook_events(received_at DESC);

-- Sync Jobs (for tracking background sync operations)
CREATE TABLE public.sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plaid_item_id UUID NOT NULL REFERENCES public.plaid_items(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,  -- initial_sync, incremental_sync, balance_refresh
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, running, completed, failed
    
    -- Progress
    transactions_added INTEGER DEFAULT 0,
    transactions_modified INTEGER DEFAULT 0,
    transactions_removed INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_jobs_plaid_item_id ON public.sync_jobs(plaid_item_id);
CREATE INDEX idx_sync_jobs_status ON public.sync_jobs(status);

-- ============================================================================
-- SPENDING ANALYTICS (for cross-account analysis)
-- ============================================================================

-- Weekly Spending Summaries
CREATE TABLE public.spending_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL,  -- weekly, monthly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Totals
    total_spending DECIMAL(19, 4) NOT NULL,
    total_income DECIMAL(19, 4) NOT NULL,
    net_change DECIMAL(19, 4) NOT NULL,
    
    -- Recurring
    recurring_spending DECIMAL(19, 4) NOT NULL,
    recurring_count INTEGER NOT NULL,
    
    -- Comparison to previous period
    spending_change_amount DECIMAL(19, 4),
    spending_change_percentage DECIMAL(5, 2),
    recurring_change_amount DECIMAL(19, 4),
    recurring_change_percentage DECIMAL(5, 2),
    
    -- Category breakdown
    category_breakdown JSONB,  -- {category: amount}
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX idx_spending_summaries_user_id ON public.spending_summaries(user_id);
CREATE INDEX idx_spending_summaries_period ON public.spending_summaries(period_start DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_agent_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spending_summaries ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own plaid_items" ON public.plaid_items
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own accounts" ON public.accounts
    FOR SELECT USING (
        plaid_item_id IN (SELECT id FROM public.plaid_items WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (
        account_id IN (
            SELECT a.id FROM public.accounts a
            JOIN public.plaid_items pi ON a.plaid_item_id = pi.id
            WHERE pi.user_id = auth.uid()
        )
    );

-- Merchants are public (read-only for users)
CREATE POLICY "Anyone can view merchants" ON public.merchants
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view merchant_aliases" ON public.merchant_aliases
    FOR SELECT USING (true);

CREATE POLICY "Users can view own recurring_transactions" ON public.recurring_transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own price_changes" ON public.price_changes
    FOR SELECT USING (
        recurring_transaction_id IN (
            SELECT id FROM public.recurring_transactions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own alerts" ON public.alerts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification_preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own push_tokens" ON public.push_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own agent_decisions" ON public.agent_decisions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agent_permissions" ON public.user_agent_permissions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own spending_summaries" ON public.spending_summaries
    FOR SELECT USING (auth.uid() = user_id);

-- Webhook events and sync jobs are service-only (no user access via RLS)
-- These will be accessed by the backend service account

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plaid_items_updated_at BEFORE UPDATE ON public.plaid_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON public.merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON public.recurring_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON public.push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Optional - Common Merchants)
-- ============================================================================

-- Uncomment to seed common subscription merchants
/*
INSERT INTO public.merchants (canonical_name, display_name, category, is_subscription, typical_frequency) VALUES
    ('netflix', 'Netflix', 'entertainment', true, 'monthly'),
    ('spotify', 'Spotify', 'entertainment', true, 'monthly'),
    ('apple', 'Apple', 'technology', true, 'monthly'),
    ('amazon_prime', 'Amazon Prime', 'shopping', true, 'monthly'),
    ('hulu', 'Hulu', 'entertainment', true, 'monthly'),
    ('disney_plus', 'Disney+', 'entertainment', true, 'monthly'),
    ('hbo_max', 'HBO Max', 'entertainment', true, 'monthly'),
    ('youtube_premium', 'YouTube Premium', 'entertainment', true, 'monthly'),
    ('adobe', 'Adobe', 'software', true, 'monthly'),
    ('microsoft_365', 'Microsoft 365', 'software', true, 'monthly'),
    ('dropbox', 'Dropbox', 'software', true, 'monthly'),
    ('google_one', 'Google One', 'software', true, 'monthly'),
    ('icloud', 'iCloud', 'software', true, 'monthly'),
    ('gym', 'Gym Membership', 'fitness', true, 'monthly'),
    ('planet_fitness', 'Planet Fitness', 'fitness', true, 'monthly');
*/
