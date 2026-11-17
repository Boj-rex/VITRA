-- ==============================================================================
-- VITRA Database Schema & Row Level Security Migration
-- Migration: 0001_initial_schema.sql
-- ==============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  country text not null default 'Nigeria',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 2. CVS (Master CV Records)
-- ------------------------------------------------------------------------------
create table if not exists public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled CV',
  career_profile text not null default 'experienced-professional',
  template_id text not null default 'classic-professional'
    check (template_id in (
      'classic-professional',
      'modern-minimal',
      'corporate-executive',
      'graduate-entry'
    )),
  structured_content jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{"fontSize":"medium","spacing":"normal","hiddenSections":[],"sectionOrder":["summary","experience","education","skills","projects","certifications","additional"]}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'complete', 'tailored')),
  parent_cv_id uuid references public.cvs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cvs_user_id on public.cvs(user_id);
create index if not exists idx_cvs_updated_at on public.cvs(updated_at desc);

-- ------------------------------------------------------------------------------
-- 3. CV VERSIONS (Snapshots & Tailored History)
-- ------------------------------------------------------------------------------
create table if not exists public.cv_versions (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.cvs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null default 1,
  label text not null default 'Saved version',
  template_id text not null default 'classic-professional',
  structured_content jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cv_versions_cv_id on public.cv_versions(cv_id);
create index if not exists idx_cv_versions_user_id on public.cv_versions(user_id);

-- ------------------------------------------------------------------------------
-- 4. NORMALIZED SECTION TABLES (Synced with master CV for relational queries)
-- ------------------------------------------------------------------------------
create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.cvs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  institution text not null,
  qualification text not null,
  field_of_study text not null default '',
  start_date text not null default '',
  end_date text not null default '',
  is_current boolean not null default false,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_education_cv_id on public.education(cv_id);

create table if not exists public.work_experience (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.cvs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  job_title text not null,
  location text not null default '',
  employment_type text not null default 'Full-time',
  start_date text not null default '',
  end_date text not null default '',
  is_current boolean not null default false,
  description text not null default '',
  achievements jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_work_experience_cv_id on public.work_experience(cv_id);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.cvs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  skill_category text not null default 'technical',
  created_at timestamptz not null default now()
);

create index if not exists idx_skills_cv_id on public.skills(cv_id);

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.cvs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  issuing_organization text not null default '',
  issue_date text not null default '',
  expiry_date text not null default '',
  credential_url text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_certifications_cv_id on public.certifications(cv_id);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.cvs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  role text not null default '',
  technologies jsonb not null default '[]'::jsonb,
  outcome text not null default '',
  project_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_cv_id on public.projects(cv_id);

-- ------------------------------------------------------------------------------
-- 5. CV UPLOADS (Original Document Preservation)
-- ------------------------------------------------------------------------------
create table if not exists public.cv_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cv_id uuid references public.cvs(id) on delete set null,
  original_file_path text not null,
  original_file_name text not null,
  file_type text not null check (file_type in ('pdf', 'docx')),
  file_size integer not null check (file_size > 0 and file_size <= 10485760),
  extracted_text text not null default '',
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'extracted', 'reviewed', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_cv_uploads_user_id on public.cv_uploads(user_id);

-- ------------------------------------------------------------------------------
-- 6. CV ANALYSES (Recommendations & Quality Audits)
-- ------------------------------------------------------------------------------
create table if not exists public.cv_analyses (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.cvs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cv_analyses_cv_id on public.cv_analyses(cv_id);
create index if not exists idx_cv_analyses_user_id on public.cv_analyses(user_id);

-- ------------------------------------------------------------------------------
-- 7. JOB DESCRIPTIONS (Role-Specific Tailoring)
-- ------------------------------------------------------------------------------
create table if not exists public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cv_id uuid references public.cvs(id) on delete set null,
  job_title text not null,
  company text not null default '',
  description text not null,
  extracted_requirements jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_descriptions_user_id on public.job_descriptions(user_id);

-- ------------------------------------------------------------------------------
-- 8. AI USAGE LOGS (Rate-Limit & Operational Monitoring — No CV PII Logged)
-- ------------------------------------------------------------------------------
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  status text not null default 'success' check (status in ('success', 'error', 'rate_limited')),
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_logs_user_date on public.ai_usage_logs(user_id, created_at desc);

-- ------------------------------------------------------------------------------
-- 9. AUTOMATIC UPDATED_AT & PROFILE TRIGGER
-- ------------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_cvs_updated_at on public.cvs;
create trigger set_cvs_updated_at
  before update on public.cvs
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'country', 'Nigeria')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.cvs enable row level security;
alter table public.cv_versions enable row level security;
alter table public.education enable row level security;
alter table public.work_experience enable row level security;
alter table public.skills enable row level security;
alter table public.certifications enable row level security;
alter table public.projects enable row level security;
alter table public.cv_uploads enable row level security;
alter table public.cv_analyses enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.ai_usage_logs enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- CVs
create policy "Users can view own CVs" on public.cvs
  for select using (auth.uid() = user_id);
create policy "Users can insert own CVs" on public.cvs
  for insert with check (auth.uid() = user_id);
create policy "Users can update own CVs" on public.cvs
  for update using (auth.uid() = user_id);
create policy "Users can delete own CVs" on public.cvs
  for delete using (auth.uid() = user_id);

-- CV Versions
create policy "Users can manage own CV versions" on public.cv_versions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Normalized child tables
create policy "Users can manage own education" on public.education
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own work_experience" on public.work_experience
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own skills" on public.skills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own certifications" on public.certifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Uploads, Analyses, Job Descriptions, AI Logs
create policy "Users can manage own cv_uploads" on public.cv_uploads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own cv_analyses" on public.cv_analyses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own job_descriptions" on public.job_descriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can view own ai_usage_logs" on public.ai_usage_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert own ai_usage_logs" on public.ai_usage_logs
  for insert with check (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 11. PRIVATE STORAGE BUCKET & POLICIES
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cv-documents',
  'cv-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

create policy "Users can upload own CV documents"
  on storage.objects for insert
  with check (
    bucket_id = 'cv-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own CV documents"
  on storage.objects for select
  using (
    bucket_id = 'cv-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own CV documents"
  on storage.objects for delete
  using (
    bucket_id = 'cv-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

