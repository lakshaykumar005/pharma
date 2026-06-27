# Anthem Biosciences — Project Command Center

A live, database-backed status dashboard for the **Anthem Biosciences Limited** ETP
(effluent treatment plant) demonstration project, built by **Aapaavani Environmental
Solutions**. Tracks three engineering lines — Demo-Plant & Sensors, SCADA Automation,
Membrane Skid — through procurement, delivery, installation and commissioning.

Palette: **black · white · red**. Fully responsive (mobile + desktop).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** (CSS-first `@theme`)
- **Prisma 7** ORM with a **SQLite** database (better-sqlite3 driver adapter)
- All data pages are **server-rendered on demand** from the database — no static data.

## Setup

```bash
npm install            # also runs `prisma generate`
npm run db:migrate     # create the SQLite DB + schema  (first time)
npm run db:seed        # load the real Gantt data
npm run dev            # http://localhost:3000
```

Environment lives in `.env` (see `.env.example`):

```
DATABASE_URL="file:./dev.db"
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:seed` | Seed the database from the project plan |
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

## Deploying to production

SQLite is for local development. For Vercel, provision a managed Postgres
(e.g. Neon via the Vercel Marketplace), then:

1. Change the datasource `provider` to `postgresql` in `prisma/schema.prisma`.
2. Swap the driver adapter in [`app/lib/db.ts`](app/lib/db.ts) (e.g. `@prisma/adapter-neon`).
3. Set `DATABASE_URL` to the Postgres connection string in the Vercel project env.
4. Run `prisma migrate deploy` + seed.
