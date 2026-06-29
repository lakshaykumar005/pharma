# Anthem Biosciences — Project Command Center

A live, database-backed status dashboard for the **Anthem Biosciences Limited** ETP
(effluent treatment plant) demonstration project, built by **Aapaavani Environmental
Solutions**. Tracks three engineering lines — Demo-Plant & Sensors, SCADA Automation,
Membrane Skid — through procurement, delivery, installation and commissioning.

Palette: **white · black · red** (light theme). Fully responsive (mobile + desktop).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** (CSS-first `@theme`)
- **Prisma 7** ORM on **Supabase Postgres** (`@prisma/adapter-pg` driver adapter)
- All data pages are **server-rendered on demand** from the database — no static data.

## Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard click **Connect → ORMs (Prisma)** and copy the two
   connection strings into `.env` (template in `.env.example`):
   - `DATABASE_URL` — pooled (port 6543, `?pgbouncer=true`) → used at runtime
   - `DIRECT_URL` — direct (port 5432) → used for migrations + seeding
3. Generate an auth secret: `openssl rand -hex 32` → put it in `AUTH_SECRET`.
4. Create the tables and seed:

```bash
npm install            # also runs `prisma generate`
npm run db:push        # create all tables in Supabase (or run prisma/supabase-schema.sql)
npm run db:seed        # load users, departments, phases, tasks, subtasks
npm run dev            # http://localhost:3000
```

> Prefer SQL? Paste [`prisma/supabase-schema.sql`](prisma/supabase-schema.sql) into the
> Supabase **SQL Editor** instead of `db:push`, then run `npm run db:seed`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm run db:push` | Push the Prisma schema to Supabase (creates tables) |
| `npm run db:seed` | Seed the database from the project plan |
| `npm run db:migrate` | Create/apply a migration (dev, uses `DIRECT_URL`) |
| `npm run db:reset` | Drop, re-migrate and re-seed |
| `npm run db:studio` | Open Prisma Studio to browse/edit data |

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/snapshot` | Full programme state (project, phases, tasks, team) |
| `GET` | `/api/tasks` | All tasks/milestones |
| `GET` | `/api/tasks/:id` | One task with phase, dependencies, neighbours |
| `PATCH` | `/api/tasks/:id` | Update `{ pct }`; rolls up to phase + milestone |

Editing a task's progress on its profile page writes through `PATCH` and the phase
percentage is recomputed (work-day weighted) in a single transaction.

## Data model

`Project` (settings) · `Department` · `Member` · `Phase` · `Task` · `Dependency`
(predecessor edges, FS/FF). Defined in [`prisma/schema.prisma`](prisma/schema.prisma),
seeded in [`prisma/seed.ts`](prisma/seed.ts) from the real Gantt figures.

## Deploying to Vercel

The same Supabase database works locally and in production.

1. Add `DATABASE_URL`, `DIRECT_URL` and `AUTH_SECRET` to the Vercel project's
   Environment Variables (use the Supabase pooled URL for `DATABASE_URL`).
2. Deploy — `prisma generate` runs on install, and pages connect to Supabase at
   request time over the pooled connection.
3. Tables/seed are managed against Supabase via `db:push` + `db:seed` (run once).
