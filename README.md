# School Year Calendar Web App

A production-ready web application for managing school year calendars, instructional days, breaks, and special schedules.

## Project Location

All files have been created in: **`C:\Users\shama\school-year-calendar`**

## Quick Start

### 1. Install Dependencies

Open PowerShell and navigate to the project:

```powershell
cd C:\Users\shama\school-year-calendar
```

**Install backend dependencies:**
```powershell
cd backend
npm install
```

**Install frontend dependencies:**
```powershell
cd ../frontend
npm install
```

### 2. Set Up Database

1. Create a PostgreSQL database named `school_calendar`
2. Copy `backend\.env.example` to `backend\.env` and configure your database connection:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/school_calendar?schema=public"
   PORT=3001
   NODE_ENV=development
   UPLOAD_DIR=./uploads
   ```
3. Run migrations:
   ```powershell
   cd backend
   npm run db:generate
   npm run db:migrate
   ```

### 3. Run the Application

**Terminal 1 - Backend:**
```powershell
cd C:\Users\shama\school-year-calendar\backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\shama\school-year-calendar\frontend
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## Project Structure

```
C:\Users\shama\school-year-calendar\
├── backend\
│   ├── src\
│   │   ├── routes\        # API endpoints
│   │   ├── services\      # Business logic
│   │   └── index.ts
│   ├── prisma\
│   │   └── schema.prisma
│   └── package.json
└── frontend\
    ├── src\
    │   ├── api\          # API client
    │   ├── components\   # React components
    │   ├── pages\        # Page components
    │   └── store\        # State management
    └── package.json
```

## Features

- ✅ School year management
- ✅ Day type classification (Instructional, Non-attendance, Break, Special Schedule)
- ✅ Schedule templates with customizable periods
- ✅ Break management (multi-day ranges)
- ✅ Dashboard with metrics (days remaining, percent complete)
- ✅ Interactive calendar view
- ✅ File upload support
- ✅ Settings page for configuration

## Next Steps

1. Complete Step 1: Install dependencies (see above)
2. Complete Step 2: Set up database
3. Start both servers
4. Open http://localhost:3000 in your browser
5. Create your first school year in the Settings page

For detailed documentation, see the full README in the project root.

