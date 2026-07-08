# UMIS API Reference

The Upemba Medical Information System (UMIS) exposes a REST API powered by Django REST Framework (DRF).

## Base URL
All API requests must be prefixed with the API versioning namespace:
```
http://localhost:8001/api/v1/
```

## Authentication
UMIS uses JWT (JSON Web Tokens) for authentication.
- **Login Endpoint**: `/api/v1/auth/login/`
- **Refresh Endpoint**: `/api/v1/auth/refresh/`

All subsequent requests must include the token in the HTTP Authorization header:
```http
Authorization: Bearer <your_access_token>
```

## Core Modules

### 1. Beneficiaries (`/api/v1/beneficiaries/`)
Handles the management of ICCN employees and their dependents.
- `GET /employees/`: List all employees (Searchable by matricule).
- `POST /employees/`: Register a new employee.
- `GET /dependents/`: List all dependents.

### 2. Pharmacy (`/api/v1/pharmacy/`)
Handles stock, batches, requisitions, and consumption.
- `GET /stock/`: View aggregated current stock of all medicines.
- `GET /medicines/`: List all registered medicines in the catalog.
- `POST /movements/`: Record a stock movement (Requisition or Consumption).

### 3. Consultations (`/api/v1/consultations/`)
Handles clinical records and encounters.
- `GET /encounters/`: View patient medical encounters.
- `POST /encounters/`: Record a new patient visit.

## Interactive API Documentation
When running the development server, you can view the fully interactive Swagger/OpenAPI documentation by navigating to:
```
http://localhost:8001/swagger/
```
or 
```
http://localhost:8001/redoc/
```
*(If DRF-Spectacular or Swagger is configured in `urls.py`)*
