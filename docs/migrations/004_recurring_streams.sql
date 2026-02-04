-- Migration: 004_recurring_streams
-- Description: Add recurring_streams table for Plaid Recurring Transactions API
-- Date: 2024-01-XX

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

-- ============================================================================
-- RECURRING STREAMS TABLE
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
-- ALERTS TABLE (NEW VERSION)
-- ============================================================================

-- Drop old alerts table if it exists with old schema
DROP TABLE IF EXISTS public.alerts CASCADE;

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
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.recurring_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recurring_streams" ON public.recurring_streams
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts" ON public.alerts
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_recurring_streams_updated_at BEFORE UPDATE ON public.recurring_streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
