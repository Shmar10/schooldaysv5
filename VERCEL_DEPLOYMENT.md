# Vercel Deployment Guide

This guide will walk you through deploying the School Year Calendar application to Vercel from GitHub.

## Prerequisites

Before you begin, make sure you have:

- A **GitHub account** with your code pushed to a repository
- A **Vercel account** (sign up at [vercel.com](https://vercel.com) - free tier available)
- A **PostgreSQL database** (we'll use Vercel Postgres or an external provider)
- Your code committed and pushed to GitHub

## Overview

This application has two parts that need to be deployed:
1. **Frontend** - React/Vite application (deployed to Vercel)
2. **Backend** - Node.js/Express API (deployed to Vercel as a serverless function)

We'll deploy both as separate Vercel projects, or you can deploy them together.

## Option 1: Deploy Frontend and Backend Separately (Recommended)

This approach gives you better control and easier management.

### Part A: Deploy Backend API

#### Step 1: Prepare Backend for Vercel

1. **Modify `backend/src/index.ts` to support serverless mode:**

   Update the end of `backend/src/index.ts` to export the app for Vercel:
   
   ```typescript
   // ... existing code ...
   
   // Error handler (must be last)
   app.use(errorHandler);
   
   // Export for Vercel serverless functions
   // Vercel will use this export when deployed
   export default app;
   
   // Only start server if running locally (not on Vercel)
   // Vercel sets VERCEL=1 environment variable
   if (!process.env.VERCEL) {
     app.listen(PORT, () => {
       logger.info(`Server running on port ${PORT}`, {
         port: PORT,
         nodeEnv: env.NODE_ENV,
       });
     });
   }
   ```

   **Note:** This allows the app to work both locally (with `app.listen()`) and on Vercel (as a serverless function).

2. **Create `vercel.json` in the backend directory:**

   Create `backend/vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "dist/index.js"
       },
       {
         "src": "/(.*)",
         "dest": "dist/index.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Update `backend/package.json` to include build script:**

   Make sure your `package.json` has:
   ```json
   {
     "scripts": {
       "build": "tsc",
       "start": "node dist/index.js"
     }
   }
   ```

4. **Create `backend/.vercelignore` (optional):**

   ```
   node_modules
   .env
   .env.local
   uploads
   *.test.ts
   *.test.js
   ```

#### Step 2: Set Up Database

You have two options for the database:

**Option A: Vercel Postgres (Recommended for simplicity)**

1. In your Vercel dashboard, go to your project
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Create a new Postgres database
4. Copy the connection string (you'll use this in environment variables)

**Option B: External PostgreSQL (e.g., Supabase, Neon, Railway)**

1. Sign up for a PostgreSQL provider (e.g., [Supabase](https://supabase.com), [Neon](https://neon.tech))
2. Create a new database
3. Copy the connection string

#### Step 3: Deploy Backend to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign in**

2. **Click "Add New Project"**

3. **Import your GitHub repository:**
   - Select your repository
   - Choose the branch (usually `main`)

4. **Configure the project:**
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   DATABASE_URL = your_postgres_connection_string
   PORT = 3001 (or leave empty, Vercel will set this)
   NODE_ENV = production
   UPLOAD_DIR = /tmp/uploads (Vercel uses /tmp for writable directories)
   FRONTEND_URL = https://your-frontend-domain.vercel.app
   ```

   **Note:** You'll need to update `FRONTEND_URL` after deploying the frontend.

6. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Note the deployment URL (e.g., `https://your-backend.vercel.app`)

#### Step 4: Run Database Migrations

After deployment, you need to run migrations. You have a few options:

**Option A: Run migrations locally pointing to production DB**

```powershell
cd backend
# Set DATABASE_URL to your production database
$env:DATABASE_URL="your_production_database_url"
npm run db:migrate deploy
```

**Option B: Use Vercel CLI**

```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
cd backend
vercel link

# Run migrations
vercel env pull .env.production
# Set DATABASE_URL in .env.production
npm run db:migrate deploy
```

**Option C: Add a migration endpoint (temporary)**

Add a route in your backend to run migrations (remove after use for security):

```typescript
// Only for initial setup - remove after migrations are done
app.post('/api/migrate', async (req, res) => {
  // Add authentication check here!
  const { execSync } = require('child_process');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  res.json({ success: true });
});
```

### Part B: Deploy Frontend

#### Step 1: Prepare Frontend for Vercel

1. **Create `vercel.json` in the frontend directory (optional):**

   ```json
   {
     "version": 2,
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "vite"
   }
   ```

2. **Update frontend environment variables:**

   Create `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-backend.vercel.app
   ```

   Or you can set this in Vercel's environment variables (see below).

#### Step 2: Deploy Frontend to Vercel

1. **Go to [vercel.com](https://vercel.com)**

2. **Click "Add New Project"**

3. **Import your GitHub repository:**
   - Select the same repository
   - Choose the branch (usually `main`)

4. **Configure the project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (should auto-detect)
   - **Output Directory:** `dist` (should auto-detect)
   - **Install Command:** `npm install`

5. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   VITE_API_URL = https://your-backend.vercel.app
   ```

   **Important:** Replace `your-backend.vercel.app` with your actual backend URL from Part A.

6. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Your frontend will be available at `https://your-frontend.vercel.app`

#### Step 3: Update Backend CORS

After deploying the frontend, update the backend's `FRONTEND_URL` environment variable:

1. Go to your backend project in Vercel
2. Go to **Settings** → **Environment Variables**
3. Update `FRONTEND_URL` to your frontend URL: `https://your-frontend.vercel.app`
4. Redeploy the backend (or it will auto-redeploy)

## Option 2: Deploy as Monorepo (Single Project)

If you prefer to deploy everything in one Vercel project:

1. **Create `vercel.json` in the root directory:**

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "backend/dist/index.js",
         "use": "@vercel/node"
       },
       {
         "src": "frontend/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "backend/dist/index.js"
       },
       {
         "src": "/(.*)",
         "dest": "frontend/dist/$1"
       }
     ]
   }
   ```

2. **Update build scripts:**

   You'll need to build both frontend and backend. Create a root `package.json`:

   ```json
   {
     "scripts": {
       "build": "cd backend && npm install && npm run build && cd ../frontend && npm install && npm run build"
     }
   }
   ```

3. **Deploy as a single project** with all environment variables.

## Post-Deployment Steps

### 1. Run Database Migrations

Make sure your database schema is up to date (see Part A, Step 4 above).

### 2. Test Your Deployment

1. Visit your frontend URL
2. Check browser console for errors
3. Test API endpoints
4. Verify database connections

### 3. Set Up Custom Domain (Optional)

1. Go to your project in Vercel
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

### 4. Set Up Environment Variables for Different Environments

Vercel supports different environments:
- **Production:** Used for production deployments
- **Preview:** Used for pull request previews
- **Development:** Used for local development with `vercel dev`

Set environment variables for each environment as needed.

## Important Considerations

### File Uploads

Vercel's serverless functions have limitations:
- **File system is read-only** except for `/tmp`
- Files in `/tmp` are **ephemeral** (deleted after function execution)
- **Solution:** Use cloud storage (AWS S3, Cloudinary, etc.) for persistent file storage

Update your upload handling to use cloud storage in production.

### Database Connection Pooling

For serverless functions, use connection pooling:
- **Vercel Postgres:** Automatically handles pooling
- **External PostgreSQL:** Use a connection pooler like PgBouncer or Prisma's connection pooling

Update your `DATABASE_URL` to use a pooled connection:
```
postgresql://user:password@host:port/database?pgbouncer=true&connection_limit=1
```

### CORS Configuration

Make sure your backend allows requests from your frontend domain:
- Update `FRONTEND_URL` in backend environment variables
- The backend code already uses this for CORS configuration

### Environment Variables

**Backend required variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `FRONTEND_URL` - Your frontend domain
- `NODE_ENV` - Set to `production`
- `UPLOAD_DIR` - Use `/tmp/uploads` for Vercel

**Frontend required variables:**
- `VITE_API_URL` - Your backend API URL

## Troubleshooting

### Build Failures

**"Module not found" errors:**
- Make sure all dependencies are in `package.json`
- Check that `node_modules` is not in `.gitignore` incorrectly
- Verify build commands are correct

**TypeScript errors:**
- Run `npm run build` locally first to catch errors
- Check `tsconfig.json` configuration

### Runtime Errors

**"Cannot connect to database":**
- Verify `DATABASE_URL` is set correctly
- Check database allows connections from Vercel IPs
- Ensure database is accessible (not behind firewall)

**"CORS errors":**
- Verify `FRONTEND_URL` matches your actual frontend domain
- Check that backend CORS configuration is correct

**"Environment variable not found":**
- Make sure all required variables are set in Vercel dashboard
- Variables starting with `VITE_` must be set for frontend
- Redeploy after adding new environment variables

### Database Migration Issues

**"Migration failed":**
- Run migrations manually using one of the methods above
- Check database connection string is correct
- Verify Prisma schema is up to date

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:
- **Production:** Deploys from `main` branch (or your default branch)
- **Preview:** Creates preview deployments for pull requests

To disable auto-deployment:
1. Go to **Settings** → **Git**
2. Configure deployment settings

## Monitoring and Logs

- **View logs:** Go to your project → **Deployments** → Click a deployment → **Functions** tab
- **Real-time logs:** Use Vercel CLI: `vercel logs`
- **Analytics:** Available in Vercel dashboard (may require upgrade)

## Quick Reference

**Backend Deployment:**
- Root Directory: `backend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: Other

**Frontend Deployment:**
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: Vite

**Required Environment Variables:**
- Backend: `DATABASE_URL`, `FRONTEND_URL`, `NODE_ENV`, `UPLOAD_DIR`
- Frontend: `VITE_API_URL`

## Next Steps

After deployment:
1. Test all functionality
2. Set up monitoring
3. Configure custom domain (if desired)
4. Set up backups for your database
5. Review Vercel's usage limits and upgrade if needed

