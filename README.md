# fast-acwd-api

Production-ready REST API built with **Fastify**, **Prisma**, **PostgreSQL**, and **TypeScript**.

## Features

- Fastify 5 with structured logging (Pino)
- Request validation and response serialization via Zod
- Prisma ORM with PostgreSQL
- Environment validation at startup
- Health and readiness probes (`/api/v1/health`, `/api/v1/health/ready`)
- Graceful shutdown on `SIGINT` / `SIGTERM`
- Security headers (`@fastify/helmet`) and CORS
- Centralized error handling (validation, Prisma, HTTP errors)
- Example CRUD routes for `User`

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

## Quick start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL
docker compose up -d

# Run migrations
npm run db:migrate

# Load sample users (optional)
npm run db:seed

# Start dev server (hot reload)
npm run dev
```

The API listens at `http://localhost:3000`.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Liveness check |
| GET | `/api/v1/health/ready` | Readiness (includes DB ping) |
| GET | `/api/v1/users` | List users |
| GET | `/api/v1/users/:id` | Get user by ID |
| POST | `/api/v1/users` | Create user |
| PATCH | `/api/v1/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Soft-delete user |

### Example requests

```bash
# Create a user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Alice","lastName":"Example","email":"alice@example.com","password":"Password123!","phone":"5551234567"}'

# List users
curl http://localhost:3000/api/v1/users
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run typecheck` | Type-check without emit |
| `npm run db:migrate` | Create/apply dev migrations |
| `npm run db:migrate:deploy` | Apply migrations in production |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed sample users (idempotent by email) |

Seeded users share the development password `Password123!` (stored as bcrypt hash; never returned by the API).

Database URLs are configured in `prisma.config.ts` (Prisma 7). The generated client lives at `src/generated/prisma` after `npm run db:generate`.

## Project structure

```
src/
├── app.ts                    # Fastify app factory
├── server.ts                 # Entry point & graceful shutdown
├── config/                   # Environment and app config
├── lib/                      # Shared utilities (errors, prisma helpers)
├── plugins/                  # Fastify plugins (config, prisma)
├── routes/                   # Top-level route registration (health, modules)
└── modules/                  # Feature modules (handler → service → repository)
    └── users/
        ├── user.schema.ts    # Zod request/response contracts
        ├── user.repository.ts # Data access (Prisma)
        ├── user.service.ts   # Business logic
        ├── user.routes.ts    # HTTP handlers
        └── index.ts          # Module plugin (wires layers, registers routes)
prisma/
└── schema.prisma             # Database schema
```

New features: add a folder under `modules/` with the same four files plus `index.ts`.
```

## Production notes

1. Set `NODE_ENV=production` and a strong `DATABASE_URL`.
2. Run `npm run build` then `npm start`.
3. Apply migrations with `npm run db:migrate:deploy` before starting the app.
4. Configure your reverse proxy to forward `X-Request-Id` for traceability.
5. Restrict CORS `origin` in `src/app.ts` for your frontend domain(s).
