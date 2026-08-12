# deploywise-api

Backend API skeleton (Express + TypeScript + Prisma).

Run locally:

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. From repo root install dependencies: `npm install`.
3. Generate Prisma client: `npx prisma generate --schema=database/prisma/schema.prisma`.
4. Start dev server: `npm run dev --workspace=apps/api`.

Health: GET /health
