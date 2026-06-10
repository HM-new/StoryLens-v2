import dotenv from 'dotenv';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Load .env from StoryLens-v2/ (one level above the server workspace).
// server/src/index.ts → up 2 → StoryLens-v2/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import { storiesRouter } from './routes/stories.js';
import { adminRouter } from './routes/admin.js';

const PORT = Number(process.env.PORT || 3002);

const warnings: string[] = [];
if (!process.env.GEMINI_API_KEY) warnings.push('GEMINI_API_KEY missing (Phases 1-6 will fail)');
if (warnings.length) {
  console.warn('[storylens] env warnings:', warnings.join(', '));
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/ping', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/stories', storiesRouter);
app.use('/api/admin', adminRouter);

// Production: serve Vite build (kid UI + admin studio) from the same origin as /api.
const appRoot = path.resolve(__dirname, '../..');
const distDir = path.join(appRoot, 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (req.path.startsWith('/admin')) {
      return res.sendFile(path.join(distDir, 'admin.html'));
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[storylens] api listening on http://localhost:${PORT}`);
});
