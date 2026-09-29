# deploywise-api

Backend API skeleton (Express + TypeScript + Prisma).

Run locally:

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. From repo root install dependencies: `npm install`.
3. Generate Prisma client: `npx prisma generate --schema=database/prisma/schema.prisma`.
4. Start dev server: `npm run dev --workspace=apps/api`.

GitLab deployment POC configuration (API server only): set `GITLAB_URL`,
`GITLAB_PROJECT_ID`, and `GITLAB_TOKEN` in the local API `.env` file. Never put the GitLab token in the web app or commit
it. Apply the `add_gitlab_deployment_requests` migration and regenerate the
Prisma Client before starting the API.

Health: GET /health
