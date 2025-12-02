# Database Setup Guide

## Step 1: Install PostgreSQL (if not installed)

If PostgreSQL is not installed, download and install it:

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download the Windows installer
   - Or use the installer from: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Install PostgreSQL:**
   - Run the installer
   - Remember the password you set for the `postgres` superuser
   - Default port is `5432` (keep this unless you have a conflict)
   - Complete the installation

3. **Add PostgreSQL to PATH (if needed):**
   - PostgreSQL is usually installed at: `C:\Program Files\PostgreSQL\<version>\bin`
   - Add this to your system PATH if `psql` command doesn't work

## Step 2: Create the Database

Once PostgreSQL is installed, create the database:

### Option A: Using psql Command Line

```powershell
# Connect to PostgreSQL (you'll be prompted for the postgres user password)
psql -U postgres

# Then in the psql prompt, run:
CREATE DATABASE school_calendar;

# Exit psql
\q
```

### Option B: Using pgAdmin (GUI Tool)

1. Open **pgAdmin** (installed with PostgreSQL)
2. Connect to your PostgreSQL server
3. Right-click on "Databases" → "Create" → "Database"
4. Name: `school_calendar`
5. Click "Save"

### Option C: Using SQL Command Directly

```powershell
# Replace 'your_password' with your postgres password
psql -U postgres -c "CREATE DATABASE school_calendar;"
```

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```powershell
   cd C:\Users\shama\school-year-calendar\backend
   Copy-Item .env.example .env
   ```

2. Edit `.env` file with your database credentials:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/school_calendar?schema=public"
   PORT=3001
   NODE_ENV=development
   UPLOAD_DIR=./uploads
   ```

   **Replace:**
   - `YOUR_PASSWORD` with your PostgreSQL postgres user password
   - `postgres` with your username if different
   - `5432` with your port if different
   - `localhost` with your host if different

## Step 4: Run Database Migrations

```powershell
cd C:\Users\shama\school-year-calendar\backend

# Generate Prisma Client
npm run db:generate

# Run migrations to create tables
npm run db:migrate
```

## Step 5: Verify Setup

Test the connection:

```powershell
# This should connect successfully
npm run db:studio
```

This opens Prisma Studio in your browser where you can view your database.

## Troubleshooting

### "psql: command not found"
- PostgreSQL may not be in your PATH
- Try using the full path: `"C:\Program Files\PostgreSQL\<version>\bin\psql.exe" -U postgres`
- Or add PostgreSQL bin directory to your system PATH

### "password authentication failed"
- Make sure you're using the correct password for the postgres user
- You can reset the password in pgAdmin if needed

### "database already exists"
- The database is already created, you can skip Step 2

### Connection refused errors
- Make sure PostgreSQL service is running
- Check Windows Services: `services.msc` → Look for "postgresql-x64-<version>"
- Start the service if it's stopped

### Port 5432 already in use
- Another PostgreSQL instance might be running
- Change the port in your `.env` file and PostgreSQL config

## Alternative: Using Docker (if you prefer)

If you have Docker installed:

```powershell
# Run PostgreSQL in Docker
docker run --name school-calendar-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=school_calendar -p 5432:5432 -d postgres

# Then use this DATABASE_URL in .env:
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/school_calendar?schema=public"
```

