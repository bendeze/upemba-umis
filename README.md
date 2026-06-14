# Upemba Medical Information System (UMIS)

UMIS is a local, offline-first medical information system built exclusively for the medical personnel of the Upemba National Park (Lusinga). It is designed to operate securely in remote environments with limited internet connectivity.

## Features
- **Offline-First Architecture**: Built to function fully without internet.
- **Beneficiaries Management**: Secure management of employees and their dependents.
- **Pharmacy & Inventory**: Track stock movements, consumption, and historical requisitions.
- **Secure Access**: JWT-based authentication with strict domain validations (`@forgottenparks.org`).
- **Bilingual Interface**: Fully translated in English and French.

## Installation via PyPI

The project is packaged and distributed via PyPI for easy updates. To install or update the system:

```bash
# Using pip
pip install --upgrade umis

# Using uv (recommended)
uv pip install --upgrade umis
```

## Running the Application

After installation, start the server using the built-in CLI command:

```bash
umis-start
```

The application will be accessible at `http://localhost:8001/`.

## Architecture
- **Backend**: Django & Django REST Framework
- **Frontend**: Next.js (React), TailwindCSS, built as static files and served by Django.

## Development

See the `src/` directory for backend and frontend source code. This project uses `uv` for Python dependency management and `npm` for the frontend.

## License
MIT License
