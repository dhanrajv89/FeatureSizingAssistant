# Feature Sizing Assistant

Feature Sizing Assistant helps pre-sales and delivery teams convert rough feature ideas into structured estimates. The project is now split into two deployable apps:

- `frontend/` – React 19 + Vite + Material UI dashboard
- `server/` – Node.js Express API with Prisma/PostgreSQL and LangChain-powered LLM sizing

## Folder Layout

```
.
+-- frontend/
¦   +-- src/               # React source (components, pages, providers, routes)
¦   +-- public/            # Static assets served by Vite
¦   +-- package.json       # Frontend scripts
¦   +-- ...                # vite.config.ts, tsconfig.json, .env.example, etc.
+-- server/
    +-- src/               # Express routes, services, auth, LLM helpers
    +-- prisma/            # Prisma schema & migrations
    +-- package.json       # Backend scripts
```

## Local Development

1. **Install dependencies**

   ```bash
   npm install --prefix frontend
   npm install --prefix server
   ```

2. **Environment variables**

   ```bash
   cp frontend/.env.example frontend/.env.local
   cp server/.env.example server/.env
   ```

   - `frontend/.env.local` should set `VITE_API_URL=http://localhost:4000`.
   - `server/.env` requires Google OAuth keys, `AUTH_JWT_SECRET`, `DATABASE_URL`, LLM config, etc.

3. **Database & Prisma**

   ```bash
   npm run prisma:generate --prefix frontend
   npm run prisma:migrate:dev --prefix frontend
   ```

4. **Run the apps**

   ```bash
   npm run dev:server --prefix frontend   # starts Express API on 4000
   npm run dev --prefix frontend          # in another terminal, starts Vite on 5173
   ```

   Visit http://localhost:5173 and sign in with Google to reach the dashboard.

## Frontend Scripts (run with `npm run <script> --prefix frontend` or inside `frontend/`)

| Script | Description |
| ------ | ----------- |
| `dev` | Start Vite dev server |
| `build` | Production build |
| `preview` | Preview `dist/` locally |
| `lint` | Run ESLint |
| `dev:server` | Start backend in watch mode |
| `build:server` | Compile backend TypeScript |
| `start:server` | Run compiled backend |
| `prisma:generate` | Generate Prisma client |
| `prisma:migrate:dev` | Apply local Prisma migrations |
| `prisma:migrate:deploy` | Apply migrations in deploy envs |
| `prisma:studio` | Launch Prisma Studio |

## Deployment on Render (summary)

1. **Database** – Create a Render PostgreSQL instance, copy the `DATABASE_URL`.
2. **Backend Web Service**
   - Root: `server`
   - Build: `npm install && npm run build && npm run prisma:migrate:deploy`
   - Start: `npm run start`
   - Env vars: `CLIENT_URL`, `SERVER_URL`, `DATABASE_URL`, OAuth + LLM keys, JWT secret, etc.
3. **Frontend Static Site**
   - Root: `frontend`
   - Build: `npm install && npm run build`
   - Publish: `dist`
   - Env vars: `VITE_API_URL=<backend URL>`
4. Update Google OAuth redirect URIs to the Render backend URL and test the flow end-to-end.

## Notes

- Secrets should never be committed; store them in `.env` files locally and environment variables in production.
- The server enforces env validation via `server/src/env.ts`.
- Module sizing heuristics and risk generation live under `server/src/llm/` and can be tuned per deployment.

Happy sizing!
