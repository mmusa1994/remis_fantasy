# User Authentication System Setup Guide

This guide will walk you through setting up the complete user authentication system with Google OAuth, email verification, subscriptions, and rate limiting.

## 🗄️ Database Setup

### 1. Run the Database Migration

Execute the SQL migration file to create all necessary tables:

```bash
# Connect to your Supabase database and run:
```

```sql
-- Copy and paste the content from: 
-- db/sql/user-auth-system-migration.sql
```

### 2. Verify Database Structure

After running the migration, you should have these tables:
- `users` - Main user accounts
- `email_verifications` - OTP verification codes
- `subscription_plans` - Available subscription tiers
- `subscriptions` - User subscriptions
- `user_ai_usage` - User-based AI usage tracking
- `user_sessions` - Session management

## 🔐 Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# SMTP for Email Verification
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# OpenAI (existing)
OPENAI_API_KEY=your-openai-key
```

## 🔧 Google OAuth Setup

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one

### Step 2: Enable Google+ API
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it

### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Select "Web application"
4. Add these authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Step 4: Get Client ID and Secret
Copy the Client ID and Client Secret to your environment variables.

## 📧 Email Setup

### Gmail Setup (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
   - Use this password as `SMTP_PASS`

### Other SMTP Providers
Update SMTP settings accordingly for:
- **SendGrid**: `smtp.sendgrid.net`, port 587
- **Mailgun**: `smtp.mailgun.org`, port 587
- **AWS SES**: Region-specific SMTP endpoint

## 🚀 Installation & Dependencies

Install required packages:

```bash
npm install next-auth bcryptjs nodemailer @types/nodemailer @types/bcryptjs
```

## 🧪 Testing the Implementation

### 1. Test Database Migration
```bash
# Check if all tables were created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### 2. Test Email Verification
1. Go to `/signup`
2. Enter email and details
3. Check if OTP email is received
4. Complete registration process

### 3. Test Google OAuth
1. Go to `/login`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Check if user is created in database

### 4. Test AI Rate Limiting
1. Sign in as a user
2. Go to `/premier-league/ai-team-analysis`
3. Ask multiple questions to test rate limiting
4. Verify limits are user-based, not IP-based

## 🎯 Key Features Implemented

### ✅ Authentication Features
- [x] Email/password registration with OTP verification
- [x] Google OAuth integration
- [x] Secure session management with NextAuth
- [x] Password hashing with bcrypt
- [x] Email verification system

### ✅ User Management
- [x] User profile management page
- [x] Name and avatar editing
- [x] Account information display
- [x] Session management

### ✅ Rate Limiting & Subscriptions
- [x] User-based rate limiting (replaced IP-based)
- [x] Subscription plans (Free: 3, Starter: 10, Pro: 15, Premium: 50)
- [x] Automatic free subscription creation
- [x] AI usage tracking per user

### ✅ Security Features
- [x] Row Level Security (RLS) policies
- [x] Proper database constraints
- [x] Secure password storage
- [x] Session token management

### ✅ UI/UX Features
- [x] Responsive login/signup forms
- [x] Authentication gates for AI features
- [x] Usage tracking display
- [x] Multi-language support (EN/BS)
- [x] Dark/light theme support

## 📱 Available Routes

### Authentication Routes
- `/login` - Sign in page
- `/signup` - Registration with OTP
- `/profile` - User profile management

### Protected Routes
- `/premier-league/ai-team-analysis` - Requires authentication
- (Future: Analytics and other premium features)

## 🔒 Security Best Practices Implemented

1. **Password Security**: Bcrypt hashing with salt
2. **Session Security**: JWT tokens with secure cookies
3. **Database Security**: RLS policies and proper constraints
4. **Rate Limiting**: User-based limits prevent abuse
5. **Email Security**: OTP verification with expiration
6. **OAuth Security**: Secure Google integration

## 🎨 Subscription Plans

| Plan | Price | AI Queries/Week | Target Users |
|------|--------|-----------------|--------------|
| Free | €0.00 | 3 | Casual users |
| Starter | €0.99 | 10 | Regular FPL managers |
| Pro | €2.99 | 15 | Serious competitors |
| Premium | €9.99 | 50 | Professional analysts |

## 🚨 Common Issues & Solutions

### Issue: Google OAuth not working
**Solution**: Check redirect URIs match exactly, enable Google+ API

### Issue: Emails not sending
**Solution**: Verify SMTP credentials, check app password for Gmail

### Issue: Database errors
**Solution**: Ensure migration ran completely, check RLS policies

### Issue: Rate limiting not working
**Solution**: Verify user sessions are working, check AI usage table

## 🔄 What's Next?

### Phase 2 - Payment Integration
- [ ] Stripe integration for subscriptions
- [ ] PayPal integration option
- [ ] Subscription management UI
- [ ] Billing history

### Phase 3 - Advanced Features
- [ ] Usage analytics dashboard
- [ ] Referral system
- [ ] Advanced user preferences
- [ ] API key management for power users

## 📞 Support

For any issues with this implementation:
1. Check the console for errors
2. Verify environment variables
3. Test database connectivity
4. Review Supabase logs

---

**Important**: After completing this setup, all AI features will require user authentication. The old IP-based rate limiting has been completely replaced with user-based limits tied to subscription plans.