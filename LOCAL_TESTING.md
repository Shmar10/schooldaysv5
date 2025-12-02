# Testing Locally

## Server Running
A local HTTP server is now running on port 8000.

## Access the App
Open your browser and go to:
```
http://localhost:8000
```

## Testing Option 1 (Weekend Feature)

### What to Test:
1. **Navigate to a weekend date:**
   - Use the calendar navigation or date picker
   - Go to any **Saturday** or **Sunday**

2. **What you should see:**
   - ✅ Cheerful message: "No School - Enjoy Your Weekend!"
   - ✅ Day name (e.g., "Saturday is a day to relax and recharge ☀️")
   - ✅ Purple gradient background
   - ✅ **NO** schedule periods/chips shown
   - ✅ **NO** schedule labels (like "Wednesday schedule")

3. **Weekday behavior (should still work):**
   - Regular weekdays should show schedules normally
   - Holidays should show holiday messages

### To Stop the Server:
Press `Ctrl+C` in the terminal where the server is running.

### Alternative: Start Server Manually
If the server stops, you can restart it with:
```powershell
python -m http.server 8000
```

Or use Node.js:
```powershell
npx http-server -p 8000
```

## If Option 1 Doesn't Work
We can rollback and try Option 3:
```powershell
git reset --hard HEAD~1
```

