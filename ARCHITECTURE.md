# VITRA Architecture

## 1. High-Level Architecture

Vitra uses a unified Next.js App Router full-stack architecture where all sensitive operations (authentication, database persistence, file validation, text extraction, OpenAI calls, and PDF/DOCX binary export) execute exclusively on the server.

- **Public Layer (`app/page.tsx`, `app/(public)/*`)**: Static and SSR public marketing pages styled with DM Serif Display and Inter on a Warm Ivory (`#F6F3ED`) / Forest Green (`#173B30`) editorial design system.
- **Auth Layer (`app/(auth)/*`, `app/api/auth/*`, `app/auth/callback`, `proxy.ts`)**: Handles registration, login, email verification, password reset, and optimistic route protection via `proxy.ts`, reinforced by server-component `requireAuthenticatedUser()` and per-request API authentication checks.
- **Authenticated Workspace (`app/(dashboard)/*`)**: Dashboard, guided CV wizard (`/create/*`), CV upload (`/upload`), extraction review & analysis (`/analysis`), live split-pane CV editor (`/editor/[cvId]`), saved CVs (`/my-cvs`), and account/privacy deletion (`/settings/*`).

## 2. Backend & Data Access Layer

- **`services/cv-service.ts`**: Abstracts CV CRUD, version snapshots, file uploads, analyses, job descriptions, and account deletion.
- **`lib/auth/session.ts`**: Resolves authenticated user identity from Supabase SSR cookies (or HMAC-signed dev session cookies when running in local dev mode).
- **`lib/config/env.ts`**: Evaluates external service readiness cleanly without exposing secrets to the client.

## 3. AI Writing Engine (`lib/ai/openai-service.ts`)

- Executed strictly server-side using the official `openai` SDK.
- Enforces `ANTI_FABRICATION_SYSTEM_PROMPT` across every prompt so employers, degrees, dates, skills, and metrics are never fabricated.
- Validates every JSON completion against strict `zod` schemas before returning data.
- Tracks per-user daily usage against `VITRA_DAILY_AI_LIMIT` in `ai_usage_logs` without storing sensitive CV contents in logs.
- Returns honest `503` unconfigured status when `OPENAI_API_KEY` is absent.

## 4. Document Processing & Export Architecture

- **Extraction (`lib/document-processing/`)**:
  - `extractor.ts`: Checks file extension, 10 MB limit, and binary magic bytes (`%PDF-` for PDF; `PK\x03\x04` + `word/document.xml` for DOCX), then extracts raw text via `unpdf` or `mammoth`.
  - `cv-parser.ts`: Converts extracted text into `StructuredCvContent`, identifying uncertain fields instead of silently dropping content.
- **Generation (`lib/document-generation/`)**:
  - `pdf-generator.ts`: Builds selectable vector A4 PDFs using `pdf-lib`, supporting automatic page breaks, word wrapping, clickable URI link annotations, and all 4 templates.
  - `docx-generator.ts`: Builds editable Microsoft Word documents using `docx`, preserving headings, spacing, bullet lists, hyperlinks, and template styling.
- **Shared Source of Truth**: `components/templates/CvDocumentPreview.tsx`, `pdf-generator.ts`, and `docx-generator.ts` all render directly from the same `StructuredCvContent` and `CvEditorSettings`.

