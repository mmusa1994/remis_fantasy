# 🧪 Testing Authentication Flow Guide

## Pre-Testing Checklist

✅ Google Cloud Console OAuth kreirane  
✅ SMTP email konfigurisan  
✅ Environment variables dodane  
✅ Database migration izvršena  

## Step 1: Run Database Migration

```bash
# Idi na Supabase dashboard i izvršti SQL:
# Copy-paste content from: db/sql/user-auth-system-migration.sql
```

## Step 2: Start Development Server

```bash
cd /Users/muhamedmusa/Desktop/remis-fantasy
npm run dev
```

## Step 3: Test Email Registration Flow

### Test 1: Email Signup
1. Idi na `http://localhost:3000/signup`
2. Unesi:
   - **Name**: Test User
   - **Email**: tvoj-test-email@gmail.com
   - **Password**: test123456
   - **Confirm Password**: test123456
3. Klikni **Send Verification Code**
4. Provjeri email za OTP kod (6 cifara)
5. Unesi OTP i klikni **Verify & Create Account**
6. Trebalo bi da te redirecta na `/premier-league`

### Expected Results:
- ✅ Email sa OTP kodom primljen
- ✅ User kreiran u `users` tabeli
- ✅ Free subscription kreiran
- ✅ AI usage record kreiran
- ✅ Welcome email poslan

## Step 4: Test Google OAuth Flow

### Test 2: Google Sign In
1. Otvori new incognito window
2. Idi na `http://localhost:3000/login`
3. Klikni login ikonicu (desno u navbar-u)
4. Klikni **Sign In with Google**
5. Completo Google OAuth flow
6. Trebalo bi da te vrati na aplikaciju kao logovan user

### Expected Results:
- ✅ Google OAuth popup otvoren
- ✅ User kreiran u `users` tabeli sa Google provider
- ✅ Free subscription kreiran
- ✅ Redirectovan na aplikaciju

## Step 5: Test AI Analysis Authentication

### Test 3: AI Feature Protection
1. **Logout** iz aplikacije
2. Idi na `http://localhost:3000/premier-league/ai-team-analysis`
3. Trebalo bi da vidiš authentication gate
4. **Login** (email ili Google)
5. Trebao bi da imaš pristup AI feature-u
6. Postavi pitanje i provjeri rate limiting

### Expected Results:
- ✅ AI feature zaštićen za neautentifikovane
- ✅ AI feature dostupan nakon login-a
- ✅ Rate limiting radi (3 pitanja tjedno za free tier)

## Step 6: Test Profile Management

### Test 4: User Profile
1. Klikni na svoj avatar u navbar-u
2. Klikni **My Profile**
3. Edit svoje ime
4. Provjeri subscription info
5. Provjeri AI usage tracking

### Expected Results:
- ✅ Profile podatci prikazani
- ✅ Ime se može editovati
- ✅ Subscription plan prikazan (Free)
- ✅ AI usage prikazan (X/3 remaining)

## Step 7: Test Logout Flow

### Test 5: Logout
1. Klikni na avatar
2. Klikni **Sign Out**
3. Trebao bi da budeš redirectovan na home page
4. Navbar treba pokazati login opcije

## 🔍 Debug Common Issues

### Issue 1: Google OAuth Error
**Symptom**: "redirect_uri_mismatch"  
**Solution**: Provjeri da li je `http://localhost:3000/api/auth/callback/google` dodan u Google Cloud Console

### Issue 2: Email ne stiže
**Symptom**: OTP email se ne šalje  
**Solution**: 
- Provjeri Gmail App Password
- Provjeri spam folder
- Provjeri SMTP settings u .env.local

### Issue 3: Database Error
**Symptom**: "table users does not exist"  
**Solution**: Izvršti database migration SQL u Supabase

### Issue 4: NextAuth Error
**Symptom**: NextAuth konfiguracija greška  
**Solution**: Provjeri NEXTAUTH_SECRET i NEXTAUTH_URL u .env.local

## ✅ Success Indicators

Kada sve radi, trebao bi imati:

1. **Navbar login dropdown** sa Google i Email opcijama
2. **User avatar** kad si logovan sa dropdown menu
3. **Email registration** sa OTP verifikacijom
4. **Google OAuth** instant login
5. **AI feature protection** - samo za logovane
6. **Profile management** sa subscription info
7. **Rate limiting** - 3 AI pitanja tjedno

## 🎯 Final Test: Complete User Journey

1. **Sign up** sa emailom i OTP
2. **Test AI analysis** - postavi 3 pitanja
3. **Check rate limiting** - 4to pitanje treba biti blocked
4. **Go to Profile** - provjeri usage (0/3 remaining)
5. **Logout i login** sa Google
6. **Test nav functionality** na mobile i desktop

Sve testove možeš raditi u dev mode-u (`npm run dev`).

---

**Status**: Ready for Production! 🚀