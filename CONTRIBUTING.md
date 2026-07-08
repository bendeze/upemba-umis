# Contributing to UMIS

First off, thank you for considering contributing to the Upemba Medical Information System (UMIS)! It's people like you that make open-source software such a great community.

## Development Environment Setup

UMIS uses `uv` for lightning-fast Python dependency management and `npm` for the frontend.

### Prerequisites
- Python 3.10+
- Node.js 20+
- `uv` (pip install uv)

### 1. Backend Setup
```bash
cd src/backend
# Install dependencies
uv sync
# Run migrations
uv run python manage.py migrate
# Start the backend server
uv run python manage.py runserver 0.0.0.0:8001
```

### 2. Frontend Setup
In a new terminal window:
```bash
cd src/frontend
# Install dependencies
npm install
# Start the Next.js development server
npm run dev
```

The frontend will be available at `http://localhost:3000/`.

## Pull Request Process

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Make sure your code lints.
5. Issue that pull request!

## Code Style
- **Python**: PEP-8 compliance is expected. We encourage the use of Black for formatting.
- **TypeScript/React**: We use ESLint and Prettier. Run `npm run lint` before committing.

## Questions?
If you have questions, please open an Issue.
