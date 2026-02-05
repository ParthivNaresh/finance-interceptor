-- Migration: 005_analytics_engine
-- Description: Add tables for Phase 5 Analytics Engine
-- Date: 2025-01-XX

-- ============================================================================
-- NEW ENUM TYPES
-- ============================================================================

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
-- MODIFY EXISTING TABLES
-- ============================================================================

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_internal_transfer BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_transactions_is_internal_transfer 
ON public.transactions(is_internal_transfer) WHERE is_internal_transfer = TRUE;

-- ============================================================================
-- SPENDING PERIODS (Time-based aggregations)
-- ============================================================================

DROP TABLE IF EXISTS public.spending_summaries CASCADE;

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
-- CATEGORY SPENDING (Spending by category per period)
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
-- MERCHANT SPENDING (Spending by merchant per month)
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
-- MERCHANT STATS (Lifetime statistics per merchant)
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
-- CASH FLOW METRICS (Monthly cash flow analysis)
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
-- LIFESTYLE BASELINES (Baseline spending per category)
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
-- LIFESTYLE CREEP SCORES (Monthly creep tracking)
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
-- TRANSACTION ANOMALIES (Flagged unusual transactions)
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
-- INCOME SOURCES (Detected income streams)
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
-- ANALYTICS COMPUTATION LOG (Track computation state)
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
-- ROW LEVEL SECURITY
-- ============================================================================

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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

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
