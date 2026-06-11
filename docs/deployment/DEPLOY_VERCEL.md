# Deployment Guide: Vercel

Vercel is the recommended hosting service for the app's frontend and serverless backend API.

---

## Prerequisite Configurations

1. **Vercel CLI** installed (`npm i -g vercel`), or access to the **Vercel Web Dashboard** connected to your GitHub repository.
2. Production credentials for Supabase, mail handlers, and URLs.

---

## Step-by-Step Deployment

### Method A: Using GitHub Integration (Recommended)
1. Push your repository to **GitHub / GitLab / Bitbucket**.
2. Visit [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Select your repository.
4. Configure continuous delivery settings (Defaults are correct: Vite build assets).
5. Open **Environment Variables** and insert variables (see list below).
6. Click **Deploy**. Vercel will build and host your application, auto-updating on future pushes.

### Method B: Using Vercel CLI
From your local workspace terminal, run:
```bash
vercel login
vercel
```
Follow prompts to bound the workspace, then run for final deployment:
```bash
vercel --prod
```

---

## Required Environment Variables

When deploying, add these to the **Variables** interface:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=cbogineni@gmail.com
SMTP_PASS=your-app-specific-email-pass
APP_URL=https://your-vercel-deployment.vercel.app
```

---

## Serverless Rewrite Verification
The application uses the predefined structure `vercel.json` in the root:
- `/api/*` requests route dynamically to `api/index.ts` (Hono Serverless).
- `/*` secondary routes fallback to `/index.html` (Vite SPA Client).
No extra rewrite steps are needed.
