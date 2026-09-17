# Company OS — Backend Engine

A modular, production-ready, database-driven business management and workflow backend built with **Python**, **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.x**, **Alembic**, and **Pydantic v2**.

---

## 1. Architectural Principles

1. **Database-Driven Business Rules (Zero Hardcoding)**:
   - All roles, permissions, departments, designations, billing companies, services, packages, task types, workflow stages, transitions, document numbering rules, and client pipeline statuses are stored in and driven dynamically by the database.
   - Initial reference configurations are seeded via `python -m app.seeds.runner`.
2. **Decoupled Entities**:
   - **Folders**: Organizational hierarchy.
   - **Content Items**: The digital creative assets being tracked.
   - **Workflow Stages**: Finite state machine status of an asset.
   - **Tasks**: Units of work to be performed.
   - **Assignments**: Staff responsible for executing tasks.
3. **No External Storage Lock-in**:
   - Folders, content items, and workflows operate inside PostgreSQL.
   - Abstract file storage service (`app/utils/storage.py`) allows swapping local file storage, S3, MinIO, or cloud storage without altering the workflow engine.
4. **Concurrency-Safe Sequential Numbering**:
   - Documents use the format `{DOC}-{COMPANY_CODE}-{YEAR}-{SEQUENCE}` (e.g. `QUO-ADX-2026-001`, `INV-ADX-2026-012`).
   - Atomic sequential counters per company, document type, and year use row-level locking (`SELECT FOR UPDATE`).
5. **Secure, Isolated Client Approval**:
   - External clients review creative assets via secure, single-purpose cryptographic URL tokens without accessing internal staff or administrative systems.

---

## 2. Project Structure

```
CRM OMAN/
├── alembic/                      # Alembic migration configuration & versions
│   ├── env.py
│   └── versions/
├── alembic.ini                   # Alembic environment configuration
├── app/
│   ├── main.py                   # FastAPI application factory & lifespan
│   ├── core/
│   │   ├── config.py             # Pydantic Settings (.env configuration)
│   │   ├── database.py           # Multi-dialect SQLAlchemy engine & GUID abstraction
│   │   ├── exceptions.py         # Standard application errors & response envelopes
│   │   ├── logging.py            # Structured system logger
│   │   ├── permissions.py        # RBAC dependency guards
│   │   └── security.py           # CryptContext bcrypt hashing & JWT token lifecycle
│   ├── models/                   # 34 SQLAlchemy 2.x Declarative Models
│   │   ├── user.py, role.py, department.py, designation.py, billing_company.py
│   │   ├── service.py, package.py, task_type.py, client.py
│   │   ├── workspace.py, folder.py, content.py, workflow.py
│   │   ├── task.py, approval.py, rejection.py, document.py
│   │   ├── notification.py, audit.py
│   │   └── base.py
│   ├── schemas/                  # Pydantic v2 DTOs with validation
│   ├── services/                 # Bounded context services (TaskService, ClientService, etc.)
│   ├── api/
│   │   └── v1/
│   │       ├── api.py            # Central router aggregator
│   │       └── routers/          # 15 modular REST API routers
│   ├── utils/
│   │   └── storage.py            # Abstract file storage provider
│   └── seeds/
│       ├── seed_data.py          # Reference definitions
│       └── runner.py             # Idempotent database seeder
├── tests/
│   ├── conftest.py               # Pytest client fixtures & test DB
│   ├── test_auth_rbac.py         # Auth & RBAC unit tests
│   ├── test_modules.py           # Master data, client, folder & document tests
│   └── test_e2e_critical_scenario.py # Complete 27-step critical end-to-end scenario
├── .env.example
├── requirements.txt
└── README.md
```

---

## 3. Quick Start

### 3.1 Install Dependencies
```bash
pip install -r requirements.txt
```

### 3.2 Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Database options in `.env`:
- **PostgreSQL**: `DATABASE_URL="postgresql+psycopg2://postgres:password@localhost:5432/company_os"`
- **SQLite (Default / Local Dev)**: `DATABASE_URL="sqlite:///./company_os.db"`

### 3.3 Database Migrations & Initial Seeding
Run Alembic migrations and populate reference master data:
```bash
# Run migrations
alembic upgrade head

# Run master data seeder
python -m app.seeds.runner
```

### 3.4 Start the FastAPI Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation:
- **Swagger UI**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **ReDoc**: [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 4. Running the Test Suite

Run all tests with `pytest`:
```bash
python -m pytest -v
```

This runs:
1. `tests/test_auth_rbac.py`: Authentication, token refreshes, unauthorized access rejection.
2. `tests/test_modules.py`: User creation, CLT sequential code generation, folder hierarchy cycle prevention, gapless document numbering.
3. `tests/test_e2e_critical_scenario.py`: Complete 27-step scenario from user creation, client onboarding, workspace/folders setup, photo asset registration, automatic task transitions across User A (Selection), User B (Editing), external client approval, User C (Posting), audit history logging, and real-time dashboard updates.

---

## 5. API Response Standards

### Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "INVALID_WORKFLOW_TRANSITION",
    "message": "Action 'Mark Posted' is not a valid transition from stage 'Raw'.",
    "details": null
  }
}
```
