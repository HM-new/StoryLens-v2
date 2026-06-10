# StoryLens v2

AI-powered kids comic strip generator — kid-facing story flow + admin studio for the pipeline.

## Local dev

```bash
npm install
cp .env.example .env   # add GEMINI_API_KEY
npm run dev
```

- Kid app: http://localhost:5173/
- Admin studio: http://localhost:5173/admin.html
- API: http://localhost:3002/api/ping

## Production

```bash
npm run build
PORT=3002 npm start
```

Serves the built frontend and API on one port.

## Deploy (Render)

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect the repo.
3. Set `GEMINI_API_KEY` in the service environment.
4. Share the public URL:
   - Kid app: `https://<your-app>.onrender.com/`
   - Admin: `https://<your-app>.onrender.com/admin.html`
