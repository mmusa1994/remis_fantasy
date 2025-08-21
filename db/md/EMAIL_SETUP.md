# Email Setup Instructions

## 1. Install Nodemailer

```bash
npm install nodemailer @types/nodemailer
```

## 2. Gmail App Password Setup

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password

1. Go to Google Account settings
2. Navigate to Security
3. Under "2-Step Verification", click on "App passwords"
4. Select "Mail" as the app and "Other" as the device
5. Click "Generate"
6. Copy the 16-character password

## 3. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Email Configuration
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-character-app-password

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## 4. Email Templates

The system includes 4 different email templates:

1. **Premium Liga** - Gold theme with `premium_code`
2. **Standard Liga** - Blue theme with `standard_code`
3. **Premium + H2H** - Gold theme with baby blue H2H section, codes: `premium_code` + `h2h_code`
4. **Standard + H2H** - Blue theme with baby blue H2H section, codes: `standard_code` + `h2h_code`

## 5. Testing

To test the email functionality:

1. Fill out the registration form
2. Submit the form
3. Check the user's email for the confirmation with access codes

## 6. Troubleshooting

### Common Issues:

1. **Authentication Error**: Make sure you're using an App Password, not your regular Gmail password
2. **Less secure app access**: Gmail requires App Passwords for programmatic access
3. **Environment variables**: Ensure `.env.local` is in the project root and variables are correctly named

### Debug Mode:

Check the browser console and server logs for any email-related errors. The registration will still succeed even if email sending fails.

## 7. Security Notes

- Never commit `.env.local` to version control
- Use App Passwords instead of regular passwords
- Consider using a dedicated email service for production (SendGrid, Mailgun, etc.)
