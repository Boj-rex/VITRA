# VITRA Testing & Verification

## Test Commands

- **Unit & Integration Test Suite (Vitest):**
  ```bash
  npm test
  ```
- **TypeScript Type Checking:**
  ```bash
  npm run typecheck
  ```
- **Production Build Verification:**
  ```bash
  npm run build
  ```
- **ESLint:**
  ```bash
  npm run lint
  ```

## Automated Test Coverage (`tests/vitra.test.ts`)

1. **Validation & Nigerian/International Support:** Validates `+234` and international telephone formats and password confirmation rules without requiring discriminatory fields.
2. **Scenario A (Graduate with No Formal Work Experience):** Verifies creating a complete CV using BSc education, NYSC, volunteering, and categorized skills, passing structural ATS quality checks and exporting a valid PDF.
3. **Scenario B & F (Experienced Professional, Multiple CVs, Template Switching & Exports):** Verifies creating multiple CVs, switching templates without losing content, and generating both binary PDF (`%PDF-`) and DOCX (`PK` archive) documents.
4. **File Upload Security Validation:** Verifies rejection of spoofed files (plain text renamed to `.pdf` or `.docx`) using binary magic-byte inspection.
5. **Scenario C & D (PDF & DOCX Extraction & Parsing):** Verifies extracting text from generated PDF (`unpdf`) and DOCX (`mammoth`) files and mapping into `StructuredCvContent`.
6. **Scenario E (Job Description Comparison):** Verifies matching present keywords and separating missing/unconfirmed requirements without fabricating skills.
7. **Scenario G (Cross-User Data Isolation):** Verifies User B cannot read, modify, or delete User A's CV records.
8. **Scenario H (Draft Progress Recovery):** Verifies saved draft fields persist and reload accurately.
9. **Multi-Page PDF Pagination:** Verifies long CVs with 16+ roles paginate cleanly across multiple A4 pages without clipping or errors.

## Known Test Scope Boundaries

- Automated Vitest tests run against the local development store and real `pdf-lib` / `docx` / `unpdf` / `mammoth` binaries without calling external Supabase or OpenAI APIs (as credentials are not set in this local environment).

