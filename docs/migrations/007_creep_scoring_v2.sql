-- Migration 007: Creep Scoring V2
-- Adds rolling_6mo baseline type and std deviation column for statistical thresholds

ALTER TYPE baseline_type ADD VALUE IF NOT EXISTS 'rolling_6mo';

ALTER TABLE public.lifestyle_baselines
  ADD COLUMN IF NOT EXISTS baseline_std_deviation DECIMAL(19, 4);
