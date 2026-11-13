# Sera

Scope protection for freelancers on fixed-price projects. Sera remembers what a client asked for, compares it with what was originally agreed, and shows the exact words as evidence. You review every finding; nothing is sent or approved automatically.

Built for the Unfair Weekend hackathon. Docs: [docs/](docs/README.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Create `.env.local` with:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | Supabase project |
| `OPENAI_API_KEY`, `OPENAI_ANALYSIS_MODEL` | Analysis (the model must support structured outputs) |

## Database

In the Supabase SQL editor, run `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_projects.sql`.

## Try the demo

Settings → **Load sample project** → open a conversation → **Analyze**. Sample data is always labeled.

## Checks

```bash
npx tsc --noEmit && npm run lint && npm run build
npm run eval       # runs the demo conversations through the real AI (needs OpenAI credits)
```

Package manager: npm.
