# CLAUDE.md

A learning project. Jay is building the multi-agent health insurance policy assistant from
`docs/multi-agent-insurance-assistant-guide.md` to learn LangGraph: Part B (the design: data,
retrieval, schemas, prompts, evaluation) and Part C (building it with LangChain + LangGraph).
**Jay does not want the by-hand approach** (writing the orchestration yourself with NestJS,
BullMQ, Redis); it was removed from this copy of the guide, so never steer back to it. The
untrimmed original is `~/Downloads/multi-agent-insurance-assistant-guide.md`. Jay is new to
multi-agent LLM systems; the day job is NestJS + TypeORM + MSSQL, so pgvector, embeddings, Zod
and LangGraph are all new.

## How to work with Jay

- Teach while building. One roadmap step at a time (see `README.md`). For each step: write the
  code, explain what each piece does and why, have Jay run the commands, then give a small
  exercise (something to run or change and predict the result).
- Jay likes to see a step working before moving to the next; don't run ahead several steps.
- Install each package in the step that first needs it, not all up front, so it's clear what
  each one is for. Check the current version with `npm view` before installing.
- The Gemini API key lives only in `.env` (git-ignored). Never ask Jay to paste it into chat;
  check it's set with `grep -qE '^GOOGLE_API_KEY=.+' .env` without printing it.
- Commit only when Jay asks.

## Stack and conventions

- TypeScript run directly with `tsx`; `tsc --noEmit` (TypeScript 7) only type-checks.
  ESM (`"type": "module"`), relative imports keep the `.ts` extension, top-level `await` is fine.
- No NestJS, no HTTP layer yet (maybe at the end, for streaming over SSE).
- `src/config.ts` loads `.env` with Node's built-in `process.loadEnvFile()`; values are getters
  so a script only fails on the env vars it actually uses.
- Database access: `pg` with raw SQL, one shared `Pool` in `src/db/pool.ts`. The LangGraph
  Postgres checkpointer (step 6) also uses `pg` and should reuse that pool.
- Migrations: plain SQL files in `sql/`, each safe to re-run (`IF NOT EXISTS`); `npm run db:migrate`.
- LLM and embeddings: Gemini through `@langchain/google-genai`. Model names change often; check
  the current fast and strong tiers instead of trusting the guide's `gemini-2.5-*`.

## Environment gotchas (Jay's Mac)

- The project database is Docker `pgvector/pgvector:pg16` on **port 5434**
  (`npm run db:up`, `db:psql`, `db:reset`). Port 5433 is taken by Jay's EDB Postgres 16
  install (`/Library/PostgreSQL/16`, no pgvector), so never point the app there.
- If Docker Desktop won't start: on 2026-10-27 its disk image location pointed at a missing
  external drive (`/Volumes/ /DockerData/...`; backend log said "creating disk folder ...
  permission denied"). Fix was killing the hung `com.docker.backend` and relaunching Docker.
- Node is 23.7 (out of support, works); suggest moving to 22 or 24 LTS at some point.
- Jay's Gemini key is on the **free tier**: embeddings are limited to 100 requests per minute
  and every text in a batch counts as one (a full ingest is 65). LangChain's `embedDocuments`
  hides the 429 and returns empty vectors; `embedQuery` throws the real error.

## Where things stand

- **Done:** step 0 (project setup) and step 1 (Docker + pgvector 0.8.7, `policy_documents` and
  `policy_chunks` tables with HNSW + GIN indexes, six made-up policies in `policies/`).
- One deliberate change from the guide: chunks don't carry `plan_code`/`jurisdiction`.
  Retrieval first resolves the ONE document in force for plan + country + date, then searches
  only that document's chunks by `document_id`, so an expired version can't leak into answers.
- The policies' traps (expired version, Silver waiting period, Essential's override, Platinum's
  prompt injection, US spelling) are listed in `README.md` under "Test data".
- Already demonstrated: Postgres stems "authorisation" to `authoris` and "authorization" to
  `author`, so keyword search for "pre-authorisation" misses the US policy. Hybrid search
  (vector + keyword, merged with RRF) is the fix step 2 should show.

## Next: step 2 (ingestion + hybrid search)

Needs `GOOGLE_API_KEY` in `.env` (embeddings are a Gemini call). Planned shape:

1. Read each `policies/*.md`, parse the front-matter header (plan_code, jurisdiction, version,
   title, effective_from, effective_to), hash the file, skip it if the hash is already stored.
2. Section-aware chunking: split on the `##` / `###` headings, keep the heading in `metadata`,
   fall back to ~1,000 chars with 150 overlap (`@langchain/textsplitters`) for long sections.
3. Embed in batches with `gemini-embedding-001` at **768 dimensions**. First check whether the
   LangChain embeddings wrapper can set the output size; if not, call `@google/genai` directly.
4. Insert document + chunks in one transaction.
5. Hybrid search: resolve the in-force document, then run the RRF query from guide B.3 against
   its chunks. Show vector-only vs keyword-only vs hybrid results side by side.
6. A small recall@10 check: ~10–15 labelled questions per the guide's advice, including the
   traps above.
7. Convert one policy to PDF and ingest it via text extraction (`unpdf`), so Jay sees that path too.

Then step 3: the LangGraph graph with fake (no-LLM) nodes, to learn state, reducers,
conditional edges and the revise loop at zero cost.
