# Complete Database Setup Guide for Beginners

This guide will walk you through setting up PostgreSQL and configuring the database for the School Year Calendar app, assuming you've never done this before.

---

## Table of Contents

1. [What You Need to Know](#what-you-need-to-know)
2. [Step 1: Install PostgreSQL](#step-1-install-postgresql)
3. [Step 2: Verify PostgreSQL is Running](#step-2-verify-postgresql-is-running)
4. [Step 3: Create the Database](#step-3-create-the-database)
5. [Step 4: Create Environment File](#step-4-create-environment-file)
6. [Step 5: Install Backend Dependencies](#step-5-install-backend-dependencies)
7. [Step 6: Run Database Migrations](#step-6-run-database-migrations)
8. [Step 7: Verify Everything Works](#step-7-verify-everything-works)
9. [Troubleshooting](#troubleshooting)

---

## What You Need to Know

**What is PostgreSQL?**
- PostgreSQL is a database system that stores all your app's data (school years, schedules, dates, etc.)
- Think of it like a digital filing cabinet that organizes information

**What is a Database?**
- A database is a collection of organized data
- Our app uses a database called `school_calendar` to store all school-related information

**What is a Migration?**
- A migration is a script that creates the structure (tables) in your database
- It's like building the shelves and drawers in your filing cabinet

**Don't worry!** This guide will walk you through everything step-by-step.

---

## Step 1: Install PostgreSQL

### 1.1 Download PostgreSQL

1. **Go to the PostgreSQL download page:**
   - Visit: https://www.postgresql.org/download/windows/
   - Or directly: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Choose the installer:**
   - Click "Download the installer"
   - Select the latest version (e.g., PostgreSQL 16)
   - Choose the Windows x86-64 installer
   - The file will be something like `postgresql-16.x-windows-x64.exe`

3. **Wait for the download to complete**

### 1.2 Install PostgreSQL

1. **Run the installer:**
   - Double-click the downloaded `.exe` file
   - If Windows asks for permission, click "Yes"

2. **Follow the installation wizard:**

   **a) Welcome Screen:**
   - Click "Next"

   **b) Installation Directory:**
   - Keep the default location: `C:\Program Files\PostgreSQL\16` (or your version)
   - Click "Next"

   **c) Select Components:**
   - Make sure these are checked:
     - ✅ PostgreSQL Server
     - ✅ pgAdmin 4 (this is a helpful tool to view your database)
     - ✅ Stack Builder (optional, you can uncheck this)
     - ✅ Command Line Tools
   - Click "Next"

   **d) Data Directory:**
   - Keep the default: `C:\Program Files\PostgreSQL\16\data`
   - Click "Next"

   **e) Password Setup (IMPORTANT!):**
   - **Enter a password** for the database superuser (username: `postgres`)
   - **Write this password down!** You'll need it later
   - Example: `MySecurePassword123!`
   - Click "Next"
   - ⚠️ **Warning:** The password field might look empty as you type - this is normal for security

   **f) Port:**
   - Keep the default port: `5432`
   - Click "Next"

   **g) Locale:**
   - Keep the default (usually matches your system)
   - Click "Next"

   **h) Ready to Install:**
   - Review the settings
   - Click "Next" to begin installation

   **i) Installation Progress:**
   - Wait for the installation to complete (this may take a few minutes)
   - You'll see a progress bar

   **j) Completing the Setup:**
   - When finished, you'll see "Completing the PostgreSQL Setup Wizard"
   - **Uncheck** "Launch Stack Builder" (we don't need it)
   - Click "Finish"

### 1.3 Verify Installation

1. **Check if PostgreSQL is installed:**
   - Press `Windows Key + R`
   - Type: `services.msc` and press Enter
   - Look for a service named `postgresql-x64-16` (or your version)
   - The status should be "Running"
   - If it says "Stopped", right-click it and select "Start"

2. **Check if pgAdmin was installed:**
   - Press `Windows Key` and type "pgAdmin"
   - You should see "pgAdmin 4" in the search results
   - This confirms PostgreSQL is installed

---

## Step 2: Verify PostgreSQL is Running

### Option A: Check Windows Services (Easiest)

1. Press `Windows Key + R`
2. Type: `services.msc` and press Enter
3. Find `postgresql-x64-16` (or your version number)
4. Check the "Status" column:
   - ✅ **Running** = Good! You can continue
   - ❌ **Stopped** = Right-click → "Start"

### Option B: Check via Command Line

1. Open PowerShell (Press `Windows Key`, type "PowerShell", press Enter)
2. Type this command:
   ```powershell
   Get-Service -Name postgresql*
   ```
3. Look for "Running" status

**If PostgreSQL is not running, start it:**
```powershell
Start-Service postgresql-x64-16
```
(Replace `16` with your version number)

---

## Step 3: Create the Database

You need to create a database called `school_calendar`. Here are three methods - choose the one you're most comfortable with.

### Method 1: Using pgAdmin (Easiest - Recommended for Beginners)

**pgAdmin** is a visual tool that makes database management easy.

1. **Open pgAdmin:**
   - Press `Windows Key` and type "pgAdmin 4"
   - Click on "pgAdmin 4"
   - It will open in your web browser

2. **Connect to PostgreSQL:**
   - When pgAdmin opens, you'll see a password prompt
   - Enter the password you set during installation (for user `postgres`)
   - Click "OK"
   - If you see "Save password?" - you can click "Yes" to avoid entering it every time

3. **Navigate to Databases:**
   - In the left sidebar, expand "Servers"
   - Expand "PostgreSQL 16" (or your version)
   - You'll see "Databases" - click the arrow to expand it

4. **Create the Database:**
   - Right-click on "Databases"
   - Select "Create" → "Database..."

5. **Configure the Database:**
   - In the "Database" field, type: `school_calendar`
   - Leave everything else as default
   - Click "Save"

6. **Verify:**
   - You should now see `school_calendar` in the list of databases
   - ✅ Success! Your database is created

### Method 2: Using PowerShell Command Line

If you're comfortable with command line, this is faster.

1. **Open PowerShell:**
   - Press `Windows Key`, type "PowerShell", press Enter

2. **Navigate to PostgreSQL bin folder:**
   ```powershell
   cd "C:\Program Files\PostgreSQL\16\bin"
   ```
   (Replace `16` with your version number)

3. **Create the database:**
   ```powershell
   .\psql.exe -U postgres -c "CREATE DATABASE school_calendar;"
   ```
   - You'll be prompted for the password
   - Enter the password you set during installation
   - Press Enter

4. **Verify it worked:**
   - You should see: `CREATE DATABASE`
   - ✅ Success!

### Method 3: Using psql Interactive Mode

1. **Open PowerShell** and navigate to PostgreSQL bin:
   ```powershell
   cd "C:\Program Files\PostgreSQL\16\bin"
   ```

2. **Connect to PostgreSQL:**
   ```powershell
   .\psql.exe -U postgres
   ```
   - Enter your password when prompted

3. **Create the database:**
   - You'll see a prompt like: `postgres=#`
   - Type this command:
   ```sql
   CREATE DATABASE school_calendar;
   ```
   - Press Enter
   - You should see: `CREATE DATABASE`

4. **Exit psql:**
   ```sql
   \q
   ```
   - Press Enter

---

## Step 4: Create Environment File

The app needs to know how to connect to your database. We do this with an environment file (`.env`).

### 4.1 Navigate to Backend Folder

1. Open PowerShell
2. Navigate to your project:
   ```powershell
   cd C:\Users\shama\school-year-calendar\backend
   ```

### 4.2 Create the .env File

1. **Create a new file:**
   - In PowerShell, type:
   ```powershell
   New-Item -Path .env -ItemType File
   ```

2. **Open the file in a text editor:**
   - You can use Notepad, VS Code, or any text editor
   - Right-click on the `.env` file in File Explorer
   - Select "Open with" → Choose your editor

3. **Add this content to the file:**
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/school_calendar?schema=public"
   PORT=3001
   NODE_ENV=development
   UPLOAD_DIR=./uploads
   ```

4. **Replace `YOUR_PASSWORD`:**
   - Find `YOUR_PASSWORD` in the DATABASE_URL line
   - Replace it with the actual password you set during PostgreSQL installation
   - **Example:** If your password is `MySecurePassword123!`, the line should look like:
     ```env
     DATABASE_URL="postgresql://postgres:MySecurePassword123!@localhost:5432/school_calendar?schema=public"
     ```

5. **Save the file:**
   - Press `Ctrl + S` or File → Save

### 4.3 Understanding the DATABASE_URL

Let's break down what each part means:

```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/school_calendar?schema=public
│          │        │              │         │    │              │
│          │        │              │         │    │              └─ Schema name
│          │        │              │         │    └─ Database name
│          │        │              │         └─ Port number
│          │        │              └─ Server address (localhost = your computer)
│          │        └─ Password (replace this!)
│          └─ Username
└─ Database type
```

**Important Notes:**
- If your PostgreSQL username is different from `postgres`, change it
- If your PostgreSQL port is different from `5432`, change it
- The password must match exactly what you set during installation

---

## Step 5: Install Backend Dependencies

Before we can run database migrations, we need to install the project's dependencies.

1. **Make sure you're in the backend folder:**
   ```powershell
   cd C:\Users\shama\school-year-calendar\backend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Wait for installation to complete:**
   - This may take 2-5 minutes
   - You'll see a lot of text scrolling
   - When it's done, you'll see your command prompt again

4. **Verify installation:**
   - If you see any red error messages, there might be a problem
   - If you see "added X packages" or similar, you're good to go!

---

## Step 6: Run Database Migrations

Migrations create the tables and structure in your database. Think of it as building the shelves in your filing cabinet.

### 6.1 Generate Prisma Client

Prisma is a tool that helps our app talk to the database. First, we generate the client:

```powershell
npm run db:generate
```

**What to expect:**
- You'll see: `✔ Generated Prisma Client`
- This means it worked!

### 6.2 Run Migrations

This creates all the tables in your database:

```powershell
npm run db:migrate
```

**What to expect:**
- You might see: "Enter a name for the new migration:"
- Type: `init` and press Enter
- You'll see messages about creating tables
- At the end, you should see: `✔ Applied migration`

**If you see an error:**
- Check that your `.env` file has the correct password
- Make sure PostgreSQL is running
- See the [Troubleshooting](#troubleshooting) section below

---

## Step 7: Verify Everything Works

Let's make sure everything is set up correctly!

### 7.1 Open Prisma Studio

Prisma Studio is a visual tool to view your database:

```powershell
npm run db:studio
```

**What happens:**
- A browser window should open automatically
- You'll see a page showing your database tables
- If you see tables like "SchoolYear", "Day", "Schedule", etc., everything worked!

**To close Prisma Studio:**
- Go back to PowerShell
- Press `Ctrl + C`
- Type `Y` and press Enter

### 7.2 Test the Backend Server

Let's make sure the backend can connect to the database:

```powershell
npm run dev
```

**What to expect:**
- You should see: "Server running on port 3001"
- If you see any database connection errors, check your `.env` file

**To stop the server:**
- Press `Ctrl + C`

---

## Troubleshooting

### Problem: "psql: command not found" or "psql.exe: command not found"

**Solution:**
- PostgreSQL might not be in your PATH
- Use the full path instead:
  ```powershell
  "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
  ```
- Replace `16` with your PostgreSQL version

### Problem: "password authentication failed"

**Possible causes:**
1. Wrong password in `.env` file
   - **Fix:** Double-check the password in your `.env` file matches what you set during installation
2. Wrong username
   - **Fix:** Make sure you're using `postgres` as the username, or change it in `.env` if you used a different username

### Problem: "database 'school_calendar' does not exist"

**Solution:**
- The database wasn't created
- Go back to [Step 3](#step-3-create-the-database) and create it

### Problem: "connection refused" or "could not connect to server"

**Possible causes:**
1. PostgreSQL service is not running
   - **Fix:** 
     - Press `Windows Key + R`
     - Type: `services.msc`
     - Find `postgresql-x64-16` (or your version)
     - Right-click → "Start"

2. Wrong port number
   - **Fix:** Check your `.env` file - the port should be `5432` unless you changed it during installation

3. Wrong host
   - **Fix:** Make sure `localhost` is in your DATABASE_URL (not an IP address)

### Problem: "relation does not exist" or "table does not exist"

**Solution:**
- Migrations weren't run successfully
- Try running migrations again:
  ```powershell
  npm run db:migrate
  ```

### Problem: "DATABASE_URL is required" error

**Solution:**
- The `.env` file is missing or in the wrong location
- Make sure `.env` is in the `backend` folder
- Make sure it's named exactly `.env` (not `.env.txt` or `env`)
- In Windows, you might need to show hidden files to see it

### Problem: "port 5432 already in use"

**Solution:**
- Another PostgreSQL instance might be running
- Or another application is using port 5432
- Check what's using the port:
  ```powershell
  netstat -ano | findstr :5432
  ```
- You can change the port in PostgreSQL config, but it's easier to stop the conflicting service

### Problem: Can't see `.env` file in File Explorer

**Solution:**
- Windows hides files that start with a dot by default
- In File Explorer, go to View → Show → Hidden items
- Or create it directly in PowerShell (as shown in Step 4)

### Problem: npm commands don't work

**Solution:**
- Make sure you're in the `backend` folder:
  ```powershell
  cd C:\Users\shama\school-year-calendar\backend
  ```
- Make sure you've installed dependencies:
  ```powershell
  npm install
  ```

### Problem: Prisma Studio doesn't open

**Solution:**
- It should open automatically in your default browser
- If not, look for a URL in the terminal (usually `http://localhost:5555`)
- Copy and paste that URL into your browser manually

---

## Success Checklist

✅ PostgreSQL is installed and running  
✅ Database `school_calendar` is created  
✅ `.env` file exists in `backend` folder with correct DATABASE_URL  
✅ Backend dependencies are installed (`npm install` completed)  
✅ Prisma Client is generated (`npm run db:generate` worked)  
✅ Migrations are applied (`npm run db:migrate` worked)  
✅ Prisma Studio opens and shows tables  
✅ Backend server starts without errors  

If all of these are checked, you're ready to use the app! 🎉

---

## Next Steps

Once your database is set up:

1. **Start the backend server:**
   ```powershell
   cd C:\Users\shama\school-year-calendar\backend
   npm run dev
   ```

2. **Start the frontend** (in a new terminal):
   ```powershell
   cd C:\Users\shama\school-year-calendar\frontend
   npm run dev
   ```

3. **Open the app:**
   - Go to: http://localhost:3000
   - You should see the School Year Calendar app!

---

## Getting Help

If you're still stuck:

1. **Check the error message carefully** - it usually tells you what's wrong
2. **Verify each step** - go back and make sure you completed each one
3. **Check the Troubleshooting section** above
4. **Make sure PostgreSQL is running** - this is the most common issue

Good luck! You've got this! 💪

