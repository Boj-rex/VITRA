-- ==============================================================================
-- VITRA Database Migration: Template Expansion & Security Hardening
-- Migration: 0003_template_expansion_and_security.sql
-- ==============================================================================

-- 1. Expand template_id check constraint on cvs table to accommodate all 9 templates
alter table public.cvs drop constraint if exists cvs_template_id_check;
alter table public.cvs add constraint cvs_template_id_check
  check (template_id in (
    'classic-professional',
    'modern-minimal',
    'corporate-executive',
    'graduate-entry',
    'tech-innovator',
    'nordic-clean',
    'ivy-league',
    'compact-hybrid',
    'international-banking'
  ));

-- 2. Harden trigger functions with explicit search_path
alter function public.handle_updated_at() set search_path = public;
alter function public.handle_new_user() set search_path = public;

-- 3. Revoke public/anon execute on internal security definer trigger functions
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- 4. Extend profiles table with avatar_url and cumulative generated_cvs_count
alter table if exists public.profiles
  add column if not exists avatar_url text default null,
  add column if not exists generated_cvs_count integer not null default 0;
