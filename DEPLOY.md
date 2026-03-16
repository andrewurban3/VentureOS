# Deployment to Vercel

## Prerequisites

- GitHub account
- Vercel account (free tier)
- Supabase project
- Anthropic API key
- Voyage AI API key (optional, for knowledge graph RAG)

## Steps

1. **Create a GitHub repository** and push this project:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/venture-os.git
   git push -u origin main
   ```

2. **Import to Vercel** at [vercel.com/new](https://vercel.com/new):
   - Connect your GitHub account
   - Import the repository
   - Vercel auto-detects Vite

3. **Configure environment variables** in the Vercel project settings:
   - `VITE_SUPABASE_URL` – your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` – your Supabase anon key (public, safe with RLS)
   - `ANTHROPIC_API_KEY` – server-side only (no `VITE_` prefix)
   - `VOYAGE_API_KEY` – server-side only (optional, for embeddings/RAG)

4. **Deploy** – Vercel builds and deploys automatically.

## Local development with API

For full functionality (AI and embeddings), run:

```bash
npm run dev:vercel
```

This starts Vercel dev server with both the SPA and `/api` routes. Set `ANTHROPIC_API_KEY` and `VOYAGE_API_KEY` in a `.env` file (or `.env.local`) for local use.
