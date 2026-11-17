# VITRA — AI-Powered CV Creation & Improvement Platform

Vitra is a professional, responsive, ATS-conscious CV creation and document improvement platform with plans starting at ₦6,000, built with Next.js App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, Private Storage), OpenAI, `unpdf`, `mammoth`, `pdf-lib`, and `docx`.

It serves two primary workflows:
1. **Build a New CV (No-Experience & Experienced Pathways):** Guided multi-step questionnaire supporting Nigerian qualifications (`SSCE`, `ND`, `HND`, `NCE`, `BSc`, `BA`, `BEng`, `MSc`, `MBA`, `PhD`, `ICAN/ACCA/CIPM`), `+234` and international phone formats, and a dedicated No-Experience pathway (`NYSC`, `SIWES`, internships, academic projects, volunteering).
2. **Improve an Existing CV:** Upload PDF or DOCX CVs (validated by magic bytes and MIME type up to 10 MB), preserve original files privately, extract structured CV data, run structural/ATS & AI review, accept/edit suggestions, tailor to job descriptions, and export real vector PDF and editable DOCX files.

---

## Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend:** Next.js Route Handlers (`app/api/**`), Zod validation, `proxy.ts` route protection
- **Database & Auth & Storage:** Supabase PostgreSQL with Row Level Security (RLS), Supabase Auth, Private Supabase Storage (`cv-documents`)
- **AI Writing Engine:** Official `openai` TypeScript SDK (server-side only, structured JSON outputs, strict anti-fabrication prompts)
- **Document Extraction:** `unpdf` (PDF) & `mammoth` (DOCX)
- **Document Generation:** `pdf-lib` (selectable multi-page A4 PDF with clickable links) & `docx` (editable Word `.docx`)
- **Testing:** Vitest

---

## Local Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   See `.env.example` for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `OPENAI_API_KEY`.
   > **Local Development Fallback:** If Supabase credentials are omitted while `VITRA_ALLOW_LOCAL_DEV_MODE=true`, Vitra uses a local server-side store (`.vitra-dev-data/`) for testing auth and CV CRUD locally. It honestly reports unconfigured services in **Settings → Service & Integration Status** and `/api/health`.

3. **Apply Supabase database migrations:**
   Run `supabase/migrations/0001_initial_schema.sql` inside your Supabase SQL Editor or CLI.

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Run verification commands:**
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

---

## Deployment (Vercel + Supabase)

1. Create a production Supabase project and execute `supabase/migrations/0001_initial_schema.sql`.
2. In Supabase Auth settings, configure Site URL and Redirect URLs (`https://your-domain.com/auth/callback` and `https://your-domain.com/reset-password`).
3. Deploy the Next.js project to Vercel and add all production variables from `.env.example` (`VITRA_ALLOW_LOCAL_DEV_MODE=false` in production).
4. Verify `/api/health` returns `supabaseConfigured: true` and `openAiConfigured: true`.
