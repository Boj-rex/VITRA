-- ==============================================================================
-- VITRA Database Migration: One-Time Password (OTP) Verification
-- Migration: 0004_auth_otps.sql
-- ==============================================================================

create table if not exists public.auth_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  user_id uuid,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_otps_email on public.auth_otps(email);

-- Enable RLS and restrict access strictly to internal service role
alter table public.auth_otps enable row level security;
revoke all on public.auth_otps from public, anon, authenticated;
