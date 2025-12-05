# Local Testing Guide

This guide will walk you through setting up and running the School Year Calendar application on your local computer for testing.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** (optional, for version control) - [Download here](https://git-scm.com/)

## Step 1: Install Dependencies

Open PowerShell and navigate to the project directory:

```powershell
cd C:\Users\shama\school-year-calendar
```

### Install Backend Dependencies

```powershell
cd backend
npm install
```

### Install Frontend Dependencies

```powershell
cd ../frontend
npm install
```

## Step 2: Set Up PostgreSQL Database

### 2.1 Create the Database

If you haven't already created the database, follow these steps:

**Option A: Using psql Command Line**

```powershell
# Connect to PostgreSQL (you'll be prompted for the postgres user password)
psql -U postgres

# Then in the psql prompt, run:
CREATE DATABASE school_calendar;

# Exit psql
\q
```

**Option B: Using pgAdmin (GUI Tool)**

1. Open **pgAdmin** (installed with PostgreSQL)
2. Connect to your PostgreSQL server
3. Right-click on "Databases" → "Create" → "Database"
4. Name: `school_calendar`
5. Click "Save"

### 2.2 Configure Environment Variables

1. Navigate to the backend directory:
   ```powershell
   cd C:\Users\shama\school-year-calendar\backend
   ```

2. Create a `.env` file (if it doesn't exist):
   ```powershell
   # If .env.example exists, copy it:
   Copy-Item .env.example .env
   
   # Or create a new .env file
   New-Item .env
   ```

3. Edit the `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/school_calendar?schema=public"
   PORT=3001
   NODE_ENV=development
   UPLOAD_DIR=./uploads
   FRONTEND_URL=http://localhost:3000
   ```

   **Replace:**
   - `YOUR_PASSWORD` with your PostgreSQL postgres user password
   - `postgres` with your username if different
   - `5432` with your port if different
   - `localhost` with your host if different

### 2.3 Run Database Migrations

```powershell
cd C:\Users\shama\school-year-calendar\backend

# Generate Prisma Client
npm run db:generate

# Run migrations to create tables
npm run db:migrate
```

## Step 3: Start the Application

You'll need **two terminal windows** - one for the backend and one for the frontend.

### Terminal 1: Start Backend Server

```powershell
cd C:\Users\shama\school-year-calendar\backend
npm run dev
```

The backend should start on **http://localhost:3001**

You should see output like:
```
✅ Environment variables validated successfully
Server running on port 3001
```

### Terminal 2: Start Frontend Server

Open a **new PowerShell window**:

```powershell
cd C:\Users\shama\school-year-calendar\frontend
npm run dev
```

The frontend should start on **http://localhost:3000**

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## Step 4: Access the Application

1. Open your web browser
2. Navigate to: **http://localhost:3000**
3. You should see the School Year Calendar application

## Step 5: Verify Everything Works

### Test Backend API

You can test the backend API directly:

```powershell
# Test health endpoint
curl http://localhost:3001/api/health
```

Or open in browser: http://localhost:3001/api/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "requestId": "..."
}
```

### Test Frontend Connection

1. Open the browser developer console (F12)
2. Check the Network tab to see if API calls are working
3. Try navigating to different pages in the app

## Troubleshooting

### Backend Issues

**"Environment variable validation failed"**
- Make sure your `.env` file exists in the `backend` directory
- Check that `DATABASE_URL` is correctly formatted
- Verify all required variables are set

**"Cannot connect to database"**
- Make sure PostgreSQL service is running
- Check Windows Services: `services.msc` → Look for "postgresql-x64-<version>"
- Verify your database credentials in `.env`
- Test connection: `psql -U postgres -d school_calendar`

**"Port 3001 already in use"**
- Another process is using port 3001
- Change `PORT` in your `.env` file to a different port (e.g., 3002)
- Update `FRONTEND_URL` in `.env` if needed

**"Prisma Client not generated"**
- Run: `npm run db:generate` in the backend directory

### Frontend Issues

**"Cannot connect to API"**
- Make sure the backend is running
- Check that `VITE_API_URL` in frontend matches your backend URL
- Check browser console for CORS errors
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL

**"Port 3000 already in use"**
- Another application is using port 3000
- Change the port in `frontend/vite.config.ts`:
  ```typescript
  server: {
    port: 3002, // or another available port
  }
  ```
- Update `FRONTEND_URL` in backend `.env` to match

**"Module not found" errors**
- Run `npm install` again in the frontend directory
- Delete `node_modules` and `package-lock.json`, then run `npm install`

### Database Issues

**"Database does not exist"**
- Create the database: `CREATE DATABASE school_calendar;`
- See Step 2.1 above

**"Migration errors"**
- Make sure you've run `npm run db:generate` first
- Check that your database connection is working
- Try resetting: `npm run db:migrate reset` (⚠️ This will delete all data)

**"psql: command not found"**
- PostgreSQL may not be in your PATH
- Use full path: `"C:\Program Files\PostgreSQL\<version>\bin\psql.exe" -U postgres`
- Or add PostgreSQL bin directory to your system PATH

## Development Tips

### View Database with Prisma Studio

```powershell
cd C:\Users\shama\school-year-calendar\backend
npm run db:studio
```

This opens a web interface at http://localhost:5555 where you can view and edit your database.

### Hot Reload

Both frontend and backend support hot reload:
- **Frontend**: Changes to React components will automatically refresh
- **Backend**: Changes to TypeScript files will automatically restart the server

### Build for Production (Testing)

**Backend:**
```powershell
cd backend
npm run build
npm start
```

**Frontend:**
```powershell
cd frontend
npm run build
npm run preview
```

## Next Steps

Once everything is running:

1. **Create your first school year** - Go to Settings → School Year tab
2. **Add schedules** - Create bell schedules for your school
3. **Add breaks** - Add holidays and breaks
4. **Add special days** - Mark special schedule days
5. **View dashboard** - See your calendar summary

## Stopping the Application

To stop the servers:
- Press `Ctrl + C` in each terminal window
- Or close the terminal windows

## Quick Reference

**Backend commands:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

**Frontend commands:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: http://localhost:5555
