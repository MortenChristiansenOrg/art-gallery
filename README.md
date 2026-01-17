# Art Gallery

Minimalistic personal art gallery website.

## Tech Stack
- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Convex (database + file storage)
- Vercel (hosting)

## Setup

1. Install dependencies:
```bash
bun install
```

2. Initialize Convex (requires account):
```bash
bunx convex dev
```

3. Copy `.env.example` to `.env.local` and configure:
```bash
cp .env.example .env.local
```

4. Run dev server:
```bash
bun dev
```

## Admin
Access admin at `/admin`. Default password is `admin` (change via `VITE_ADMIN_PASSWORD` env var).

## Deploy to Vercel
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `VITE_CONVEX_URL` (from Convex dashboard)
   - `VITE_ADMIN_PASSWORD`
4. Deploy
