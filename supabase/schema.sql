-- ============================================================
-- REMES SWAP — Phase 1 Schema
-- Deploy: paste into Supabase SQL Editor or run via supabase CLI
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE,
  email TEXT,
  country_code TEXT NOT NULL,
  kyc_status TEXT DEFAULT 'unverified',
  kyc_provider TEXT,
  kyc_reference_id TEXT,
  wallet_address_evm TEXT,
  wallet_address_xrpl TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chain, address)
);

-- ============================================================
-- SWAPS
-- ============================================================
CREATE TABLE IF NOT EXISTS swaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_chain TEXT NOT NULL,
  dest_chain TEXT NOT NULL,
  source_asset TEXT NOT NULL,
  dest_asset TEXT NOT NULL,
  source_amount DECIMAL(20,8) NOT NULL,
  dest_amount DECIMAL(20,8) NOT NULL,
  rate DECIMAL(20,8) NOT NULL,
  fee_amount DECIMAL(20,8) NOT NULL,
  fee_currency TEXT NOT NULL,
  bridge_tx_hash TEXT,
  evm_tx_hash TEXT,
  fiat_reference TEXT,
  status TEXT DEFAULT 'pending',
  route TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- LIQUIDITY POOLS
-- ============================================================
CREATE TABLE IF NOT EXISTS liquidity_pools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  token_a TEXT NOT NULL,
  token_b TEXT NOT NULL,
  fee_tier DECIMAL(5,4) NOT NULL,
  total_liquidity_a DECIMAL(20,8),
  total_liquidity_b DECIMAL(20,8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LIQUIDITY POSITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS liquidity_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id UUID REFERENCES liquidity_pools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount_a DECIMAL(20,8) NOT NULL,
  amount_b DECIMAL(20,8) NOT NULL,
  lp_tokens DECIMAL(20,8) NOT NULL,
  tick_lower INTEGER,
  tick_upper INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ
);

-- ============================================================
-- FIAT TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS fiat_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  country_code TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount_local DECIMAL(20,2) NOT NULL,
  amount_usd DECIMAL(20,2) NOT NULL,
  rate DECIMAL(20,8) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  partner TEXT,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- ============================================================
-- RESERVE ATTESTATIONS (PUBLIC READ — TRANSPARENCY)
-- ============================================================
CREATE TABLE IF NOT EXISTS reserve_attestations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  total_rmusd_supply DECIMAL(20,8) NOT NULL,
  treasury_holdings DECIMAL(20,2) NOT NULL,
  cash_holdings DECIMAL(20,2) NOT NULL,
  total_reserves DECIMAL(20,2) NOT NULL,
  reserve_ratio DECIMAL(6,4) NOT NULL,
  treasury_bill_ids JSONB,
  custodian TEXT NOT NULL,
  custodian_report_url TEXT,
  attestation_hash TEXT,
  auditor TEXT,
  is_verified BOOLEAN DEFAULT false
);

-- ============================================================
-- RMUSD EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS rmusd_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  chain TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  reserve_transaction_hash TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ODL TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS odl_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  swap_id UUID REFERENCES swaps(id) ON DELETE CASCADE,
  source_currency TEXT NOT NULL,
  source_amount DECIMAL(20,8) NOT NULL,
  xrp_bridge_amount DECIMAL(20,8) NOT NULL,
  xrp_bridge_duration_ms INTEGER,
  dest_currency TEXT NOT NULL,
  dest_amount DECIMAL(20,8) NOT NULL,
  xrpl_source_tx_hash TEXT NOT NULL,
  xrpl_dest_tx_hash TEXT NOT NULL,
  slippage_bps INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS (general ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  chain TEXT,
  asset TEXT,
  amount DECIMAL(20,8) NOT NULL,
  fee DECIMAL(20,8) DEFAULT 0,
  tx_hash TEXT,
  reference_id TEXT,
  status TEXT DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SETTINGS (key-value)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_swaps_user_id ON swaps(user_id);
CREATE INDEX IF NOT EXISTS idx_swaps_status ON swaps(status);
CREATE INDEX IF NOT EXISTS idx_swaps_created_at ON swaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_fiat_transactions_user_id ON fiat_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_positions_user_id ON liquidity_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_positions_pool_id ON liquidity_positions(pool_id);
CREATE INDEX IF NOT EXISTS idx_rmusd_events_user_id ON rmusd_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reserve_attestations_timestamp ON reserve_attestations(timestamp DESC);

-- ============================================================
-- ROW LEVEL SECURITY — ENABLE ON EVERY TABLE, NO EXCEPTIONS
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiat_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserve_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rmusd_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE odl_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- USERS: user can read/update own row only
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- WALLETS: user can read own wallets only
DROP POLICY IF EXISTS "wallets_select_own" ON wallets;
CREATE POLICY "wallets_select_own" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

-- SWAPS: user can read own swaps only
DROP POLICY IF EXISTS "swaps_select_own" ON swaps;
CREATE POLICY "swaps_select_own" ON swaps
  FOR SELECT USING (auth.uid() = user_id);

-- TRANSACTIONS: user can read own transactions only
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- FIAT_TRANSACTIONS: user can read own only
DROP POLICY IF EXISTS "fiat_select_own" ON fiat_transactions;
CREATE POLICY "fiat_select_own" ON fiat_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- LIQUIDITY_POSITIONS: user can read own only
DROP POLICY IF EXISTS "liq_positions_select_own" ON liquidity_positions;
CREATE POLICY "liq_positions_select_own" ON liquidity_positions
  FOR SELECT USING (auth.uid() = user_id);

-- RESERVE_ATTESTATIONS: PUBLIC READ (transparency)
DROP POLICY IF EXISTS "reserve_attestations_public_read" ON reserve_attestations;
CREATE POLICY "reserve_attestations_public_read" ON reserve_attestations
  FOR SELECT USING (true);

-- All other tables: service role only (no anon/auth policies)
-- Service role bypasses RLS automatically in Supabase

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
