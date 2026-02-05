-- Finance Interceptor Database Schema
-- PostgreSQL with Supabase extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE stream_type AS ENUM ('inflow', 'outflow');

CREATE TYPE frequency_type AS ENUM (
    'weekly',
    'biweekly',
    'semi_monthly',
    'monthly',
    'quarterly',
    'semi_annually',
    'annually',
    'unknown'
);

CREATE TYPE stream_status AS ENUM (
    'mature',
    'early_detection',
    'tombstoned'
);

CREATE TYPE alert_type AS ENUM (
    'price_increase',
    'price_decrease',
    'new_subscription',
    'cancelled_subscription',
    'missed_payment'
);

CREATE TYPE alert_severity AS ENUM (
    'low',
    'medium',
    'high'
);

CREATE TYPE alert_status AS ENUM (
    'unread',
    'read',
    'dismissed',
    'actioned'
);

CREATE TYPE user_action_type AS ENUM (
    'dismissed',
    'cancelled_subscription',
    'kept',
    'watching'
);

CREATE TYPE period_type AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

CREATE TYPE baseline_type AS ENUM ('rolling_3mo', 'rolling_12mo', 'seasonal');

CREATE TYPE anomaly_type AS ENUM (
    'large_amount',
    'new_merchant',
    'category_spike',
    'duplicate',
    'unusual_time',
    'unusual_location'
);

CREATE TYPE anomaly_context AS ENUM (
    'subscription_price_change',
    'discretionary_spike',
    'new_vendor',
    'duplicate_charge',
    'unusual_timing'
);

CREATE TYPE income_source_type AS ENUM (
    'salary',
    'freelance',
    'investment',
    'transfer',
    'refund',
    'other'
);

CREATE TYPE computation_status AS ENUM ('success', 'failed', 'in_progress');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.plaid_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL UNIQUE,
    institution_id TEXT,
    institution_name TEXT,
    institution_logo TEXT,
    encrypted_access_token TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    error_code TEXT,
    error_message TEXT,
    consent_expiration_time TIMESTAMPTZ,
    last_successful_sync TIMESTAMPTZ,
    sync_cursor TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plaid_items_user_id ON public.plaid_items(user_id);
CREATE INDEX idx_plaid_items_status ON public.plaid_items(status);

CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plaid_item_id UUID NOT NULL REFERENCES public.plaid_items(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    official_name TEXT,
    type TEXT NOT NULL,
    subtype TEXT,
    mask TEXT,
    current_balance DECIMAL(19, 4),
    available_balance DECIMAL(19, 4),
    limit_amount DECIMAL(19, 4),
    iso_currency_code TEXT DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    balance_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_plaid_item_id ON public.accounts(plaid_item_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);

-- ============================================================================
-- MERCHANT NORMALIZATION
-- ============================================================================

CREATE TABLE public.merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    category TEXT,
    logo_url TEXT,
    website TEXT,
    is_subscription BOOLEAN DEFAULT FALSE,
    typical_frequency TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merchants_canonical_name ON public.merchants(canonical_name);
CREATE INDEX idx_merchants_is_subscription ON public.merchants(is_subscription);

CREATE TABLE public.merchant_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    confidence DECIMAL(3, 2) DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_merchant_aliases_alias ON public.merchant_aliases(LOWER(alias));
CREATE INDEX idx_merchant_aliases_merchant_id ON public.merchant_aliases(merchant_id);

CREATE TABLE public.merchant_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    embedding vector(1536),
    model_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merchant_embeddings_merchant_id ON public.merchant_embeddings(merchant_id);

-- ============================================================================
-- TRANSACTIONS
-- ============================================================================

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL UNIQUE,
    amount DECIMAL(19, 4) NOT NULL,
    iso_currency_code TEXT DEFAULT 'USD',
    date DATE NOT NULL,
    datetime TIMESTAMPTZ,
    authorized_date DATE,
    authorized_datetime TIMESTAMPTZ,
    name TEXT NOT NULL,
    merchant_name TEXT,
    merchant_id UUID REFERENCES public.merchants(id),
    payment_channel TEXT,
    pending BOOLEAN NOT NULL DEFAULT FALSE,
    pending_transaction_id TEXT,
    category_id TEXT,
    category TEXT[],
    personal_finance_category_primary TEXT,
    personal_finance_category_detailed TEXT,
    personal_finance_category_confidence TEXT,
    location_address TEXT,
    location_city TEXT,
    location_region TEXT,
    location_postal_code TEXT,
    location_country TEXT,
    location_lat DECIMAL(10, 7),
    location_lon DECIMAL(10, 7),
    logo_url TEXT,
    website TEXT,
    check_number TEXT,
    is_internal_transfer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_transactions_merchant_id ON public.transactions(merchant_id);
CREATE INDEX idx_transactions_pending ON public.transactions(pending);
CREATE INDEX idx_transactions_account_date ON public.transactions(account_id, date DESC);
CREATE INDEX idx_transactions_is_internal_transfer ON public.transactions(is_internal_transfer) WHERE is_internal_transfer = TRUE;

-- ============================================================================
-- RECURRING STREAMS (FROM PLAID API)
-- ============================================================================

CREATE TABLE public.recurring_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plaid_item_id UUID NOT NULL REFERENCES public.plaid_items(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    
    stream_id TEXT NOT NULL,
    stream_type stream_type NOT NULL,
    description TEXT NOT NULL,
    merchant_name TEXT,
    
    category_primary TEXT,
    category_detailed TEXT,
    
    frequency frequency_type NOT NULL,
    first_date DATE NOT NULL,
    last_date DATE NOT NULL,
    predicted_next_date DATE,
    
    average_amount DECIMAL(12, 2) NOT NULL,
    last_amount DECIMAL(12, 2) NOT NULL,
    iso_currency_code TEXT DEFAULT 'USD',
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status stream_status NOT NULL,
    is_user_modified BOOLEAN NOT NULL DEFAULT FALSE,
    
    transaction_ids TEXT[],
    plaid_raw JSONB,
    
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(plaid_item_id, stream_id)
);

CREATE INDEX idx_recurring_streams_user_id ON public.recurring_streams(user_id);
CREATE INDEX idx_recurring_streams_plaid_item_id ON public.recurring_streams(plaid_item_id);
CREATE INDEX idx_recurring_streams_account_id ON public.recurring_streams(account_id);
CREATE INDEX idx_recurring_streams_is_active ON public.recurring_streams(is_active);
CREATE INDEX idx_recurring_streams_status ON public.recurring_streams(status);
CREATE INDEX idx_recurring_streams_stream_type ON public.recurring_streams(stream_type);
CREATE INDEX idx_recurring_streams_predicted_next ON public.recurring_streams(predicted_next_date);

-- ============================================================================
-- ALERTS
-- ============================================================================

CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recurring_stream_id UUID REFERENCES public.recurring_streams(id) ON DELETE SET NULL,
    
    alert_type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    
    status alert_status NOT NULL DEFAULT 'unread',
    user_action user_action_type,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    actioned_at TIMESTAMPTZ
);

CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_alert_type ON public.alerts(alert_type);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX idx_alerts_user_status ON public.alerts(user_id, status);
CREATE INDEX idx_alerts_recurring_stream_id ON public.alerts(recurring_stream_id);

-- ============================================================================
-- ANALYTICS ENGINE - SPENDING PERIODS
-- ============================================================================

CREATE TABLE public.spending_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period_type period_type NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    total_inflow DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_outflow DECIMAL(19, 4) NOT NULL DEFAULT 0,
    net_flow DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    total_inflow_excluding_transfers DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_outflow_excluding_transfers DECIMAL(19, 4) NOT NULL DEFAULT 0,
    net_flow_excluding_transfers DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    transaction_count INTEGER NOT NULL DEFAULT 0,
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX idx_spending_periods_user_id ON public.spending_periods(user_id);
CREATE INDEX idx_spending_periods_user_period ON public.spending_periods(user_id, period_type);
CREATE INDEX idx_spending_periods_period_start ON public.spending_periods(period_start DESC);
CREATE INDEX idx_spending_periods_finalized ON public.spending_periods(is_finalized) WHERE is_finalized = FALSE;

-- ============================================================================
-- ANALYTICS ENGINE - CATEGORY SPENDING
-- ============================================================================

CREATE TABLE public.category_spending (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period_type period_type NOT NULL,
    period_start DATE NOT NULL,
    
    category_primary TEXT NOT NULL,
    category_detailed TEXT,
    
    total_amount DECIMAL(19, 4) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    average_transaction DECIMAL(19, 4),
    largest_transaction DECIMAL(19, 4),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, period_type, period_start, category_primary)
);

CREATE INDEX idx_category_spending_user_id ON public.category_spending(user_id);
CREATE INDEX idx_category_spending_user_category ON public.category_spending(user_id, category_primary);
CREATE INDEX idx_category_spending_period ON public.category_spending(period_start DESC);

-- ============================================================================
-- ANALYTICS ENGINE - MERCHANT SPENDING
-- ============================================================================

CREATE TABLE public.merchant_spending (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period_type period_type NOT NULL DEFAULT 'monthly',
    period_start DATE NOT NULL,
    
    merchant_name TEXT NOT NULL,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
    
    total_amount DECIMAL(19, 4) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    average_transaction DECIMAL(19, 4),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, period_type, period_start, merchant_name)
);

CREATE INDEX idx_merchant_spending_user_id ON public.merchant_spending(user_id);
CREATE INDEX idx_merchant_spending_user_merchant ON public.merchant_spending(user_id, merchant_name);
CREATE INDEX idx_merchant_spending_period ON public.merchant_spending(period_start DESC);

-- ============================================================================
-- ANALYTICS ENGINE - MERCHANT STATS
-- ============================================================================

CREATE TABLE public.merchant_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    merchant_name TEXT NOT NULL,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
    
    first_transaction_date DATE NOT NULL,
    last_transaction_date DATE NOT NULL,
    
    total_lifetime_spend DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_transaction_count INTEGER NOT NULL DEFAULT 0,
    
    average_transaction_amount DECIMAL(19, 4),
    median_transaction_amount DECIMAL(19, 4),
    max_transaction_amount DECIMAL(19, 4),
    min_transaction_amount DECIMAL(19, 4),
    
    average_days_between_transactions DECIMAL(10, 2),
    most_frequent_day_of_week INTEGER,
    most_frequent_hour_of_day INTEGER,
    
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_stream_id UUID REFERENCES public.recurring_streams(id) ON DELETE SET NULL,
    primary_category TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, merchant_name)
);

CREATE INDEX idx_merchant_stats_user_id ON public.merchant_stats(user_id);
CREATE INDEX idx_merchant_stats_lifetime_spend ON public.merchant_stats(user_id, total_lifetime_spend DESC);
CREATE INDEX idx_merchant_stats_is_recurring ON public.merchant_stats(is_recurring) WHERE is_recurring = TRUE;

-- ============================================================================
-- ANALYTICS ENGINE - CASH FLOW METRICS
-- ============================================================================

CREATE TABLE public.cash_flow_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    
    total_income DECIMAL(19, 4) NOT NULL DEFAULT 0,
    total_expenses DECIMAL(19, 4) NOT NULL DEFAULT 0,
    net_cash_flow DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    savings_rate DECIMAL(5, 4),
    
    recurring_expenses DECIMAL(19, 4) NOT NULL DEFAULT 0,
    discretionary_expenses DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    income_sources_count INTEGER NOT NULL DEFAULT 0,
    expense_categories_count INTEGER NOT NULL DEFAULT 0,
    
    largest_expense_category TEXT,
    largest_expense_amount DECIMAL(19, 4),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, period_start)
);

CREATE INDEX idx_cash_flow_metrics_user_id ON public.cash_flow_metrics(user_id);
CREATE INDEX idx_cash_flow_metrics_period ON public.cash_flow_metrics(user_id, period_start DESC);

-- ============================================================================
-- ANALYTICS ENGINE - LIFESTYLE BASELINES
-- ============================================================================

CREATE TABLE public.lifestyle_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_primary TEXT NOT NULL,
    
    baseline_type baseline_type NOT NULL DEFAULT 'rolling_3mo',
    baseline_monthly_amount DECIMAL(19, 4) NOT NULL,
    baseline_transaction_count INTEGER NOT NULL,
    
    baseline_period_start DATE NOT NULL,
    baseline_period_end DATE NOT NULL,
    baseline_months_count INTEGER NOT NULL,
    
    seasonal_adjustment_factor DECIMAL(5, 4),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, category_primary)
);

CREATE INDEX idx_lifestyle_baselines_user_id ON public.lifestyle_baselines(user_id);

-- ============================================================================
-- ANALYTICS ENGINE - LIFESTYLE CREEP SCORES
-- ============================================================================

CREATE TABLE public.lifestyle_creep_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    category_primary TEXT NOT NULL,
    
    baseline_amount DECIMAL(19, 4) NOT NULL,
    current_amount DECIMAL(19, 4) NOT NULL,
    
    absolute_change DECIMAL(19, 4) NOT NULL,
    percentage_change DECIMAL(7, 4) NOT NULL,
    creep_score DECIMAL(5, 2) NOT NULL,
    
    is_inflation_adjusted BOOLEAN NOT NULL DEFAULT FALSE,
    inflation_rate_used DECIMAL(5, 4),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, period_start, category_primary)
);

CREATE INDEX idx_lifestyle_creep_scores_user_id ON public.lifestyle_creep_scores(user_id);
CREATE INDEX idx_lifestyle_creep_scores_period ON public.lifestyle_creep_scores(user_id, period_start DESC);

-- ============================================================================
-- ANALYTICS ENGINE - TRANSACTION ANOMALIES
-- ============================================================================

CREATE TABLE public.transaction_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    recurring_stream_id UUID REFERENCES public.recurring_streams(id) ON DELETE SET NULL,
    
    anomaly_type anomaly_type NOT NULL,
    anomaly_context anomaly_context,
    severity alert_severity NOT NULL,
    
    description TEXT NOT NULL,
    reference_value DECIMAL(19, 4),
    actual_value DECIMAL(19, 4),
    deviation_factor DECIMAL(10, 4),
    
    is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    is_false_positive BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    
    UNIQUE(transaction_id, anomaly_type)
);

CREATE INDEX idx_transaction_anomalies_user_id ON public.transaction_anomalies(user_id);
CREATE INDEX idx_transaction_anomalies_unreviewed ON public.transaction_anomalies(user_id, is_reviewed) WHERE is_reviewed = FALSE;
CREATE INDEX idx_transaction_anomalies_created ON public.transaction_anomalies(created_at DESC);
CREATE INDEX idx_transaction_anomalies_recurring ON public.transaction_anomalies(recurring_stream_id) WHERE recurring_stream_id IS NOT NULL;

-- ============================================================================
-- ANALYTICS ENGINE - INCOME SOURCES
-- ============================================================================

CREATE TABLE public.income_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    
    source_name TEXT NOT NULL,
    source_type income_source_type NOT NULL DEFAULT 'other',
    
    frequency frequency_type NOT NULL DEFAULT 'monthly',
    average_amount DECIMAL(19, 4) NOT NULL,
    last_amount DECIMAL(19, 4) NOT NULL,
    
    first_date DATE NOT NULL,
    last_date DATE NOT NULL,
    next_expected_date DATE,
    
    transaction_count INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    confidence_score DECIMAL(3, 2) NOT NULL DEFAULT 0.5,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, source_name)
);

CREATE INDEX idx_income_sources_user_id ON public.income_sources(user_id);
CREATE INDEX idx_income_sources_active ON public.income_sources(user_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ANALYTICS ENGINE - COMPUTATION LOG
-- ============================================================================

CREATE TABLE public.analytics_computation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    computation_type TEXT NOT NULL,
    last_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    last_transaction_date DATE,
    last_transaction_id UUID,
    
    computation_duration_ms INTEGER,
    rows_affected INTEGER,
    
    status computation_status NOT NULL DEFAULT 'success',
    error_message TEXT,
    
    UNIQUE(user_id, computation_type)
);

CREATE INDEX idx_analytics_computation_log_user_id ON public.analytics_computation_log(user_id);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    threshold_percentage DECIMAL(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, alert_type)
);

CREATE TABLE public.push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL,
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

CREATE TABLE public.agent_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    decision_type TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    trigger_entity_type TEXT,
    trigger_entity_id UUID,
    input_data JSONB NOT NULL,
    reasoning JSONB NOT NULL,
    confidence_score DECIMAL(3, 2) NOT NULL,
    action_recommended TEXT,
    action_taken TEXT,
    alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    user_responded_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_decisions_user_id ON public.agent_decisions(user_id);
CREATE INDEX idx_agent_decisions_type ON public.agent_decisions(decision_type);
CREATE INDEX idx_agent_decisions_created_at ON public.agent_decisions(created_at DESC);

CREATE TABLE public.user_agent_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    permission_type TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    scope JSONB,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE(user_id, permission_type)
);

CREATE INDEX idx_user_agent_permissions_user_id ON public.user_agent_permissions(user_id);

-- ============================================================================
-- WEBHOOKS & SYSTEM
-- ============================================================================

CREATE TABLE public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_type TEXT NOT NULL,
    webhook_code TEXT NOT NULL,
    item_id TEXT,
    plaid_item_id UUID REFERENCES public.plaid_items(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    idempotency_key TEXT UNIQUE
);

CREATE INDEX idx_webhook_events_status ON public.webhook_events(status);
CREATE INDEX idx_webhook_events_item_id ON public.webhook_events(item_id);
CREATE INDEX idx_webhook_events_received_at ON public.webhook_events(received_at DESC);

CREATE TABLE public.sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plaid_item_id UUID NOT NULL REFERENCES public.plaid_items(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    transactions_added INTEGER DEFAULT 0,
    transactions_modified INTEGER DEFAULT 0,
    transactions_removed INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_jobs_plaid_item_id ON sync_jobs(plaid_item_id);
CREATE INDEX idx_sync_jobs_status ON public.sync_jobs(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spending_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_spending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_spending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifestyle_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifestyle_creep_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_computation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_agent_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Anyone can view merchants" ON public.merchants
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view merchant_aliases" ON public.merchant_aliases
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view merchant_embeddings" ON public.merchant_embeddings
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own recurring_streams" ON public.recurring_streams
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts" ON public.alerts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own spending_periods" ON public.spending_periods
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own category_spending" ON public.category_spending
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own merchant_spending" ON public.merchant_spending
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own merchant_stats" ON public.merchant_stats
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cash_flow_metrics" ON public.cash_flow_metrics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own lifestyle_baselines" ON public.lifestyle_baselines
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own lifestyle_creep_scores" ON public.lifestyle_creep_scores
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transaction_anomalies" ON public.transaction_anomalies
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own income_sources" ON public.income_sources
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics_computation_log" ON public.analytics_computation_log
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification_preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own push_tokens" ON public.push_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own agent_decisions" ON public.agent_decisions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agent_permissions" ON public.user_agent_permissions
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

CREATE TRIGGER update_recurring_streams_updated_at BEFORE UPDATE ON public.recurring_streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spending_periods_updated_at BEFORE UPDATE ON public.spending_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_spending_updated_at BEFORE UPDATE ON public.category_spending
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_spending_updated_at BEFORE UPDATE ON public.merchant_spending
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_stats_updated_at BEFORE UPDATE ON public.merchant_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_flow_metrics_updated_at BEFORE UPDATE ON public.cash_flow_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lifestyle_baselines_updated_at BEFORE UPDATE ON public.lifestyle_baselines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_sources_updated_at BEFORE UPDATE ON public.income_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_tokens_updated_at BEFORE UPDATE ON public.push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
