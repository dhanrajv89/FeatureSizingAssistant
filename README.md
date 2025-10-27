# Feature Sizing Assistant

Feature Sizing Assistant helps pre-sales and business development teams convert free-form feature ideas into scoped delivery estimates. Authenticated users capture project context, the app calls a large language model for structured sizing, and results persist with version history plus export-ready artifacts.

## Highlights

- Google OAuth login backed by Passport + Prisma and JWT cookies
- LangChain orchestration with Zod-enforced JSON output (OpenAI or Gemini)
- React 19 + React Router + Material UI 6 dashboard powered by React Query
- Node.js + Express API with Prisma ORM and PostgreSQL persistence
- CSV and XLSX export endpoints ready for proposal attachments
- Per-project versioning with re-estimation workflow

## Tech Stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 19 + Vite + React Router + Material UI 6 + React Query |
| Backend  | Node.js (Express) + TypeScript |
| Auth     | Passport Google OAuth 2.0 + JWT cookies |
| LLM      | LangChain (@langchain/openai, @langchain/google-genai) |
| Database | PostgreSQL (Prisma ORM) |
| Export   | papaparse, xlsx |

## Quick Start

1. **Install dependencies**

   `ash
   npm install
   npm --prefix server install
   `

2. **Configure environment variables**

   `ash
   cp .env.example .env.local
   cp server/.env.example server/.env
   `

   - .env.local – point the frontend to the API (VITE_API_URL=http://localhost:4000).
   - server/.env – supply Google OAuth keys, a JWT secret, database URL, and LLM provider keys.

3. **Prepare the database**

   Ensure PostgreSQL is running, then generate the Prisma client and apply migrations:

   `ash
   npm run prisma:generate
   npx --prefix server prisma migrate dev --name init
   `

4. **Run the apps**

   In one terminal start the backend:

   `ash
   npm run dev:server
   `

   In another terminal start the React client:

   `ash
   npm run dev
   `

   Open [http://localhost:5173](http://localhost:5173) and authenticate with Google to reach the React + MUI dashboard.

## LLM Configuration

| Provider | Required variables | Example model |
| -------- | ------------------ | ------------- |
| openai | OPENAI_API_KEY, LLM_MODEL | gpt-4o-mini, gpt-4.1, etc. |
| gemini | GEMINI_API_KEY, LLM_MODEL | gemini-1.5-pro, etc. |

Set LLM_PROVIDER in server/.env accordingly. Optionally enable ENABLE_PROMPT_LOGS=true for additional LangChain logging while debugging.

## NPM Scripts

| Script | Description |
| ------ | ----------- |
| 
pm run dev | Start the Vite dev server (React frontend) |
| 
pm run build | Build the frontend for production |
| 
pm run preview | Preview the built frontend |
| 
pm run lint | Run ESLint on the frontend source |
| 
pm run dev:server | Start the Express backend with live reload (ts-node/tsx) |
| 
pm run build:server | Compile the backend (TypeScript ? dist) |
| 
pm run start:server | Run the compiled backend |
| 
pm run prisma:generate | Generate the Prisma client (backend) |
| 
pm run prisma:migrate | Apply Prisma migrations in deploy environments |
| 
pm run prisma:studio | Open Prisma Studio |

## Key Folders

`
.
+-- src/                 # React + MUI application (Vite)
¦   +-- components/      # Reusable UI (auth, dashboard, detail view, layout)
¦   +-- pages/           # React Router pages
¦   +-- providers/       # App-wide providers (Auth, QueryClient, Theme)
¦   +-- routes/          # Protected route helpers
¦   +-- lib/             # Client-side API helpers
¦   +-- styles/          # Global styles
+-- public/              # Static assets served by Vite
+-- server/              # Node.js + Express backend
¦   +-- src/
¦   ¦   +-- auth/        # Passport strategy, JWT helpers, auth middleware
¦   ¦   +-- db/          # Prisma client
¦   ¦   +-- llm/         # LangChain config, prompts, schema enforcement
¦   ¦   +-- routes/      # Express routers (auth, estimates)
¦   ¦   +-- services/    # Business logic (estimates, exports)
¦   ¦   +-- types/       # Backend DTO definitions
¦   +-- prisma/          # Prisma schema & migrations
+-- .env.example         # Frontend env sample (Vite)
+-- server/.env.example  # Backend env sample (Express)
`

## Estimation Flow

1. The user submits project metadata and platform flags from the React dashboard.
2. The Express API calls LangChain with a Zod-enforced schema to obtain modules, risks, missing items, and summary.
3. Prisma stores the estimate plus its related records and increments the project version.
4. React Query refreshes the dashboard, showing the latest sizing, version timeline, and exports.
5. CSV/XLSX download endpoints provide proposal-ready artifacts on demand.

## Notes

- Use Docker or a managed PostgreSQL service for local development and production.
- Run 
pm run lint before committing frontend changes; add automated tests as the feature set expands.
- In production deployments, run 
pm run prisma:migrate (or prisma migrate deploy) before starting the backend.

Happy sizing! Contributions and enhancements are welcome—open an issue or PR with ideas.
