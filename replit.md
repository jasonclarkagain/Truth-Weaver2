# Axiom Synapse

A high-end investigative journalism and media engine — premium dark-mode editorial platform that ingests, AI-rewrites, and publishes long-form investigative content across five classified taxonomic categories.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/axiom-synapse run dev` — run the frontend (port 25512)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI proxy (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Framer Motion, wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Replit OpenAI Integration (gpt-5-mini) for content rewriting and pitch generation
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/articles.ts` — DB schema (articles, categories, tags, article_tags)
- `artifacts/api-server/src/routes/` — Express route handlers (articles, categories, tags, search, stats)
- `artifacts/axiom-synapse/src/` — React frontend
- `lib/integrations-openai-ai-server/` — OpenAI server-side client

## Architecture decisions

- **OpenAPI-first**: All API contracts defined in `lib/api-spec/openapi.yaml` before any code. Orval generates React Query hooks and Zod validators from this spec.
- **AI-powered ingestion**: The `/api/articles/ingest` endpoint fetches any URL, strips HTML, then calls GPT to produce a 100% rewritten long-form article + pitch matrix in a single request.
- **Pitch Matrix**: Every article has three editorial angles (Academic, Editorial, Executive) stored as JSONB in the articles table, generated on ingest or on-demand via `/api/articles/:id/pitches`.
- **Dark mode only**: The frontend forces dark mode via `classList.add('dark')` — no toggle exists. The theme is electric amber on near-black (`#050505`).
- **Relational tagging**: `article_tags` join table enables many-to-many article-to-tag cross-referencing for the taxonomy navigation.

## Product

Five taxonomy categories: Ancient Anomalies, Advanced Geopolitics, Esoteric Physics, Cognitive Frontiers, Systemic Research. Users can ingest any public URL, which the AI pipeline scrapes, rewrites into original long-form prose, and packages with a three-angle pitch matrix. Command palette (Ctrl+K) provides instant fuzzy search across all articles.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before touching backend or frontend code.
- The `getRelatedArticles` endpoint omits the `limit` query param to avoid an Orval TS2308 naming collision between path-param Zod schemas and TypeScript types.
- Ingest endpoint uses Node 18+ `fetch` with a 15-second timeout — ensure the target URL is publicly accessible.
- Seeds are idempotent (`ON CONFLICT DO NOTHING`) so re-running is safe.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
