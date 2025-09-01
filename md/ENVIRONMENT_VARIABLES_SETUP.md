# ⚙️ Environment Variables Setup Guide

## Step 1: Create .env.local file

U root folderu tvoje aplikacije (`/Users/muhamedmusa/Desktop/remis-fantasy/`) kreiraj file `.env.local`:

```bash
# Otvori terminal u root folderu i izvršti:
touch .env.local
```

## Step 2: Add NextAuth Configuration

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-make-it-random-and-long
NEXTAUTH_URL=http://localhost:3000
```

**Kako generirati NEXTAUTH_SECRET:**
```bash
# U terminalu izvršti:
openssl rand -base64 32
# ili idi na: https://generate-secret.vercel.app/32
```

## Step 3: Add Google OAuth Credentials

```env
# Google OAuth (iz Google Cloud Console)
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

**Zamijeniti sa vrijednostima iz Google Cloud Console!**

## Step 4: Add Supabase Configuration

```env
# Supabase (existing - provjeri da li imaš)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 5: Add SMTP Email Configuration

### Option A: Gmail
```env
# SMTP for Email Verification (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-digit-app-password
SMTP_FROM=noreply@yourdomain.com
```

### Option B: SendGrid
```env
# SMTP for Email Verification (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

## Step 6: Add OpenAI Configuration

```env
# OpenAI (existing - provjeri da li imaš)
OPENAI_API_KEY=sk-your-openai-api-key
```

## Step 7: Complete .env.local Example

```env
# NextAuth Configuration
NEXTAUTH_SECRET=super-long-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-digit-app-password
SMTP_FROM=noreply@yourdomain.com

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key
```

## Step 8: Update for Production

Kad deployas na production, promijeni:

```env
NEXTAUTH_URL=https://yourdomain.com
SMTP_FROM=noreply@yourdomain.com
```

## ⚠️ SECURITY NOTES

1. **NIKAD** ne commituj `.env.local` u git
2. Dodaj u `.gitignore`:
   ```
   .env.local
   .env*.local
   ```
3. Za production, koristi environment variables u hosting platformi
4. Sve secret keys čuvaj sigurno

## 🧪 Verification

Provjeri da li su sve variables učitane:
```bash
npm run dev
```

Console treba pokazati da su svi environment variables učitani bez grešaka.

---

**Sljedeći korak**: Test Authentication Flow 👉