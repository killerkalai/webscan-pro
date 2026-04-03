-- WebScan Pro — Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Scan results table
CREATE TABLE IF NOT EXISTS scan_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_ms INTEGER,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_to TEXT,
  owner_contact_source TEXT,
  summary JSONB,
  ssl_info JSONB,
  performance_info JSONB,
  broken_links JSONB,
  findings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for URL lookups
CREATE INDEX IF NOT EXISTS idx_scan_results_url ON scan_results(url);
CREATE INDEX IF NOT EXISTS idx_scan_results_scanned_at ON scan_results(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_results_score ON scan_results(score);

-- Recent scans view
CREATE OR REPLACE VIEW recent_scans AS
SELECT
  id,
  url,
  score,
  scanned_at,
  email_sent,
  email_sent_to,
  summary->>'critical' AS critical_count,
  summary->>'high' AS high_count,
  summary->>'medium' AS medium_count,
  summary->>'passed' AS passed_count
FROM scan_results
ORDER BY scanned_at DESC
LIMIT 100;

-- Row Level Security (optional — disable for public scanner)
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public scanner)
CREATE POLICY "Allow public insert" ON scan_results
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read their own scan by ID
CREATE POLICY "Allow public read" ON scan_results
  FOR SELECT USING (true);
