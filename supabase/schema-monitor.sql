-- ============================================================
-- WebScan Pro — Connected Sites Monitoring Schema
-- Add these tables to your existing schema.sql
-- ============================================================

-- Connected sites (registered for monitoring)
CREATE TABLE IF NOT EXISTS connected_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_key TEXT UNIQUE NOT NULL,           -- Unique key for the embed script
  url TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | active | paused | error
  alert_frequency TEXT DEFAULT 'realtime', -- realtime | daily | weekly
  last_scan_at TIMESTAMPTZ,
  last_score INTEGER,
  last_alert_sent_at TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,
  script_verified BOOLEAN DEFAULT FALSE,   -- detected on the target site
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connected_sites_site_key ON connected_sites(site_key);
CREATE INDEX IF NOT EXISTS idx_connected_sites_status ON connected_sites(status);
CREATE INDEX IF NOT EXISTS idx_connected_sites_url ON connected_sites(url);

-- Monitor scan history (all scans for connected sites)
CREATE TABLE IF NOT EXISTS monitor_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES connected_sites(id) ON DELETE CASCADE,
  site_key TEXT NOT NULL,
  url TEXT NOT NULL,
  score INTEGER,
  previous_score INTEGER,
  score_delta INTEGER,               -- positive = improved, negative = degraded
  findings JSONB,
  new_findings JSONB,               -- findings that didn't exist in last scan
  resolved_findings JSONB,          -- findings that were fixed since last scan
  summary JSONB,
  performance JSONB,
  ssl_info JSONB,
  email_sent BOOLEAN DEFAULT FALSE,
  alert_triggered BOOLEAN DEFAULT FALSE,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitor_scans_site_id ON monitor_scans(site_id);
CREATE INDEX IF NOT EXISTS idx_monitor_scans_scanned_at ON monitor_scans(scanned_at DESC);

-- RLS Policies
ALTER TABLE connected_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read connected_sites" ON connected_sites FOR SELECT USING (true);
CREATE POLICY "Public insert connected_sites" ON connected_sites FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update connected_sites" ON connected_sites FOR UPDATE USING (true);

CREATE POLICY "Public read monitor_scans" ON monitor_scans FOR SELECT USING (true);
CREATE POLICY "Public insert monitor_scans" ON monitor_scans FOR INSERT WITH CHECK (true);
