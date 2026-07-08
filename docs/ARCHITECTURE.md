# UMIS Architecture Reference

This document defines the architectural patterns and coding guardrails that must be followed when contributing to the **Upemba Medical Information System (UMIS)**.

## 1. Core Monorepo Architecture

```
upemba-medical/
├── .github/workflows/          # CD Release Workflow (v* tags)
├── src/
│   ├── frontend/               # Next.js 15+ TypeScript SPA
│   │   ├── src/app/            # App Router (client-side export)
│   │   └── src/features/       # Domain-driven features (beneficiaries, etc.)
│   └── backend/                # Django 5+ DRF Backend
│       ├── core/               # Staging templates, static assets, and audit logs
│       ├── beneficiaries/      # Beneficiaries Management App
│       ├── umis_backend/       # Root Django configurations & settings
│       ├── cli.py              # Zero-config local runner (umis-start)
│       └── setup.py            # Python packaging definitions
```

## 2. Mandatory Packaging Guardrails

Because this application compiles into a single deployable `.whl` package, you **must** adhere to these packaging rules:

### A. Next.js Static Exporting Limitations
*   All frontend features **must** build to standard static files. **Do not use Next.js dynamic server features** (like `getServerSideProps`, `revalidate`, or Next API routes).
*   All dynamic data fetching **must** be implemented as client-side REST fetches (`TanStack Query`) targeting Django `/api/v1/` endpoints.

### B. Static Asset Integration Staging
*   The frontend exported assets must reside inside the Django `core` app to ensure setuptools captures them:
    *   **Base Index Template:** `src/backend/core/templates/index.html`
    *   **Next.js Compiled Assets:** `src/backend/core/static/` (includes `_next/` folder, chunks, favicon, media, etc.)

### C. Zero-Configuration SQLite Portability
*   Never hardcode absolute paths for databases or file uploads. 
*   Always resolve user-specific dynamic directories under the user's home folder (`~/.umis/`) in `settings.py` so the system boots securely on any local machine.

## 3. Backend Development Rules (Django + DRF)

### A. Service Layer Pattern
Keep Views and Serializers extremely "thin". All database transactions, file parsers (like Excel ingestion), and complex calculations **must** reside in a **`services.py`** file inside the respective app:
```
[DRF Viewset] ──(Validates input)──> [Serializer] ──(Calls)──> [Service Layer (services.py)]
                                                                          │
                                                                 (Handles DB writes)
                                                                          ▼
                                                                 [Relational Models]
```

### B. Soft-Deletable & Auditable Models
*   Inherit all employee/clinical models from `SoftDeleteModel` and `TimeStampedModel` inside `core/models/base.py`.
*   Always record writes and soft deletions using the **`core/audit.py`** logging engine. Store diffs in the structured `AuditLog` JSONB database.

## 4. Frontend Development Rules (Next.js + Tailwind CSS)

### A. Cyan UI Aesthetic System
We adhere strictly to a clean, neutral, access-first medical UI built with a custom cyan palette. Only use these tailwind theme hex codes for primary styles and micro-animations:
*   **Vibrant Accent:** `cyan-500` (`#26C6DA`) / Hover: `cyan-600` (`#00ACC1`)
*   **Light Glass Backgrounds:** `cyan-50` (`#E0F7FA`) / `cyan-100` (`#B2EBF2`)
*   **Harmonious Typography:** Neutral slate/gray tones.

### B. Form Validations & Caching
*   Implement all forms using `React Hook Form` and validate them strictly using `Zod` schemas inside `validation.ts`.
*   Cache all API GET queries using TanStack Query custom hooks inside `hooks/` to prevent unnecessary REST requests.
