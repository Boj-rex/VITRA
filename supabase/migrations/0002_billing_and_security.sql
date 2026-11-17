-- ==============================================================================
-- VITRA Database Migration: Billing, CV Allowances & Security
-- Migration: 0002_billing_and_security.sql
-- ==============================================================================

-- 1. Extend profiles with plan and CV limit metadata
alter table if exists public.profiles
  add column if not exists plan_id text check (plan_id in ('starter', 'pro', 'executive')),
  add column if not exists max_cvs integer not null default 0,
  add column if not exists plan_purchased_at timestamptz default null;

-- 2. Create payments table for Paystack transactions
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null unique,
  plan_id text not null check (plan_id in ('starter', 'pro', 'executive')),
  amount integer not null, -- amount in Kobo
  currency text not null default 'NGN',
  status text not null default 'success' check (status in ('pending', 'success', 'failed')),
  max_cvs integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_reference on public.payments(reference);

-- Enable RLS on payments
alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users can insert payments for their own account"
  on public.payments for insert
  with check (auth.uid() = user_id);

