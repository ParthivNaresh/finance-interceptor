-- Migration: 006_encryption_upgrade
-- Description: Upgrade encryption from static-salt PBKDF2 to per-encryption-salt Argon2id
-- Date: 2026-02-07
-- 
-- IMPORTANT: This migration requires clearing all encrypted data.
-- The new encryption format is incompatible with the old format.
--
-- New Encryption Format:
--   Base64(version || salt || fernet_ciphertext)
--   - version: 1 byte (0x01 for Argon2id)
--   - salt: 16 bytes (random per encryption)
--   - fernet_ciphertext: AES-128-CBC + HMAC
--
-- Argon2id Parameters (OWASP "Moderate" Profile):
--   - time_cost: 3
--   - memory_cost: 65536 (64 MB)
--   - parallelism: 4
--   - hash_len: 32 (256-bit derived key)
--
-- Security Improvements:
--   - Random salt per encryption (prevents rainbow table attacks)
--   - Argon2id KDF (memory-hard, GPU-resistant)
--   - Version byte for future algorithm changes

-- Step 1: Clear all data that depends on encrypted tokens
-- Run these in order due to foreign key constraints

TRUNCATE TABLE alerts CASCADE;
TRUNCATE TABLE recurring_streams CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE accounts CASCADE;
TRUNCATE TABLE plaid_items CASCADE;

-- Step 2: Clear analytics data (depends on transactions)
TRUNCATE TABLE spending_periods CASCADE;
TRUNCATE TABLE category_spending CASCADE;
TRUNCATE TABLE merchant_spending CASCADE;
TRUNCATE TABLE merchant_stats CASCADE;
TRUNCATE TABLE analytics_computation_log CASCADE;

-- Step 3: Clear webhook events
TRUNCATE TABLE webhook_events CASCADE;

-- No schema changes required - encrypted_access_token column is TEXT
-- and can hold the new format without modification.

-- After running this migration:
-- 1. Deploy the new backend code with Argon2id encryption
-- 2. Users will need to re-link their bank accounts
-- 3. New tokens will be encrypted with the secure format
