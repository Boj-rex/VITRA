# VITRA Database Architecture

Database migration file: [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql)

## Tables & Relationships

1. **`public.profiles`**
   - `id` (UUID PK, references `auth.users(id) ON DELETE CASCADE`)
   - `full_name`, `email`, `country`, `role` (`'user' | 'admin'`), timestamps
   - Auto-populated via PostgreSQL trigger `on_auth_user_created` when a new user registers.

2. **`public.cvs`**
   - `id` (UUID PK), `user_id` (FK -> `auth.users`), `title`, `career_profile`, `template_id`, `structured_content` (JSONB), `settings` (JSONB), `status` (`draft | complete | tailored`), `parent_cv_id` (nullable self-FK for duplicated/tailored versions), timestamps.

3. **`public.cv_versions`**
   - `id` (UUID PK), `cv_id` (FK -> `public.cvs`), `user_id` (FK -> `auth.users`), `version_number`, `label`, `template_id`, `structured_content` (JSONB), `created_at`.

4. **Normalized CV Child Tables** (all cascading on `cv_id` and scoped to `user_id`):
   - `public.education`
   - `public.work_experience`
   - `public.skills`
   - `public.certifications`
   - `public.projects`

5. **`public.cv_uploads`**
   - Preserves metadata and extracted text for original uploaded PDF/DOCX files stored in the private `cv-documents` bucket (`original_file_path`, `original_file_name`, `file_type`, `file_size`, `processing_status`).

6. **`public.cv_analyses`**
   - Stores AI & structural CV analysis results (`analysis_result` JSONB) linked to `cv_id` and `user_id`.

7. **`public.job_descriptions`**
   - Stores pasted target role descriptions and extracted alignment data (`extracted_requirements` JSONB).

8. **`public.ai_usage_logs`**
   - Stores `user_id`, `operation`, `model`, token counts, and `status` (`success | error | rate_limited`) for daily quota enforcement without storing CV PII.

## Security & Row Level Security (RLS)

- **RLS Enabled** on every table in `public`.
- Policies restrict `SELECT`, `INSERT`, `UPDATE`, and `DELETE` strictly to `auth.uid() = user_id` (`auth.uid() = id` on `profiles`).
- **Private Storage Bucket (`cv-documents`)**: Public access disabled (`public = false`); 10 MB limit enforced; allowed MIME types restricted to PDF and DOCX; storage RLS restricts folder access to `(storage.foldername(name))[1] = auth.uid()::text`.

