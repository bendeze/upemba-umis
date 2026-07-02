# UMIS Development Playbook & Architecture Reference

This playbook is a strict guide for AI agents and developers working on the **Upemba Medical Information System (UMIS)**. It defines the architectural patterns, coding guardrails, and packaging constraints that **must** be followed to maintain compatibility with our **Universal Wheel** and **Standalone Executable (`.exe`)** distribution channels.

---

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
│       └── umis.spec           # PyInstaller executable build rules
```

---

## 2. Mandatory Packaging Guardrails (CRITICAL)

Because this application compiles into a single `.exe` file, you **must** adhere to these packaging rules:

### A. Next.js Static Exporting Limitations
*   All frontend features **must** build to standard static files. **Do not use Next.js dynamic server features** (like `getServerSideProps`, `revalidate`, or Next API routes).
*   All dynamic data fetching **must** be implemented as client-side REST fetches (`TanStack Query`) targeting Django `/api/v1/` endpoints.
*   The API base URL is resolved dynamically via a custom Axios client mapping the local backend host (e.g. `http://127.0.0.1:8001/`).

### B. Static Asset Integration Staging
*   The frontend exported assets must reside inside the Django `core` app to ensure setuptools and PyInstaller capture them:
    *   **Base Index Template:** `src/backend/core/templates/index.html`
    *   **Next.js Compiled Assets:** `src/backend/core/static/` (includes `_next/` folder, chunks, favicon, media, etc.)
*   If you add root-level static assets (e.g. `chart.svg`), register the URL route mapping in `umis_backend/urls.py` using Django's `serve` view:
    ```python
    path('chart.svg', serve, {'document_root': os.path.join(settings.BASE_DIR, 'core', 'static'), 'path': 'chart.svg'}),
    ```

### C. Zero-Configuration SQLite Portability
*   Never hardcode absolute paths for databases or file uploads. 
*   Always resolve user-specific dynamic directories under the user's home folder (`~/.umis/`) in `settings.py` so the system boots securely on any local machine:
    ```python
    USER_HOME = Path.home()
    UMIS_DIR = USER_HOME / '.umis'
    DB_PATH = os.environ.get('UMIS_DB_PATH', str(UMIS_DIR / 'db.sqlite3'))
    ```

---

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
*   Inherit all employee/clinical models from `SoftDeleteModel` and `TimeStampedModel` inside `core/models/base.py` to ensure soft deletion is handled natively.
*   Always record writes, soft deletions, and batch uploads using the **`core/audit.py`** logging engine. Store diffs in the structured `AuditLog` JSONB database.
*   Protect critical mappings: Use `on_delete=models.PROTECT` on vital parent foreign keys (e.g., preventing deleting a `Site` while employees are linked to it).

### C. No Paginated Mappings
*   For master-detail dropdown datasets (like `Regions` and `Sites` listings), **do not paginate** DRF viewsets. Set `pagination_class = None` on these API viewsets to prevent frontend mapping components (like `regions.map`) from breaking on paginated responses.

---

## 4. Frontend Development Rules (Next.js + Tailwind CSS)

### A. Cyan UI Aesthetic System
We adhere strictly to a clean, neutral, access-first medical UI built with a custom cyan palette. Only use these tailwind theme hex codes for primary styles and micro-animations:
*   **Vibrant Accent:** `cyan-500` (`#26C6DA`) / Hover: `cyan-600` (`#00ACC1`)
*   **Light Glass Backgrounds:** `cyan-50` (`#E0F7FA`) / `cyan-100` (`#B2EBF2`)
*   **Harmonious Typography:** Neutral slate/gray tones on outfits.

### B. Sticky Non-Scrolling Sidebar Layout
The admin layout shell **must** feature a sticky sidebar:
*   The Sidebar remains fixed on the left and **does not scroll** when the user scrolls the main page.
*   The main content area behaves independently and handles standard browser scrolling.

### C. Form Validations & Caching
*   Implement all forms using `React Hook Form` and validate them strictly using `Zod` schemas inside `validation.ts`.
*   Cache all API GET queries using TanStack Query custom hooks inside `hooks/` to prevent unnecessary REST requests.

---

## 5. Dependency Management Guardrails

When adding new Python libraries:
1. Update `dependencies` inside `src/backend/pyproject.toml`.
2. Update `install_requires` inside `src/backend/setup.py`.
3. If the library includes templates or binary data, register it in the `datas` or `hiddenimports` lists inside **`src/backend/umis.spec`** to prevent PyInstaller from omitting it in the executable!
