# Fixing DATABASE_URL Format Issues

## The Problem
Your DATABASE_URL has an invalid format, likely due to special characters in your password.

## Solution: URL-Encode Your Password

If your PostgreSQL password contains special characters, they need to be URL-encoded in the DATABASE_URL.

### Common Special Characters That Need Encoding:
- `@` becomes `%40`
- `:` becomes `%3A`
- `/` becomes `%2F`
- `#` becomes `%23`
- `?` becomes `%3F`
- `&` becomes `%26`
- `%` becomes `%25`
- ` ` (space) becomes `%20`

### Example:
If your password is: `My@Pass:123`
The encoded version is: `My%40Pass%3A123`

## Quick Fix Options:

### Option 1: Use an Online URL Encoder
1. Go to: https://www.urlencoder.org/
2. Paste just your password (not the whole URL)
3. Click "Encode"
4. Copy the encoded password
5. Replace it in your DATABASE_URL

### Option 2: Use PowerShell to Encode
```powershell
[System.Web.HttpUtility]::UrlEncode("YOUR_PASSWORD_HERE")
```

### Option 3: Change Your PostgreSQL Password
If encoding is too complicated, you can change your PostgreSQL password to one without special characters:
- Use only letters, numbers, and underscores
- Example: `MyPassword123` or `postgres_password_2024`

## Correct DATABASE_URL Format:

```env
DATABASE_URL="postgresql://postgres:YOUR_ENCODED_PASSWORD@localhost:5432/school_calendar?schema=public"
```

### Examples:

**Password: `mypassword123`** (no special chars)
```env
DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/school_calendar?schema=public"
```

**Password: `My@Pass:123`** (with special chars - needs encoding)
```env
DATABASE_URL="postgresql://postgres:My%40Pass%3A123@localhost:5432/school_calendar?schema=public"
```

## Steps to Fix:

1. Open `backend/.env` file
2. Find the `DATABASE_URL` line
3. If your password has special characters, encode them
4. Or change your PostgreSQL password to one without special characters
5. Save the file
6. Try running `npm run db:migrate` again

