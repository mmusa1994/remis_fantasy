# 📧 SMTP Email Setup Guide

## Option 1: Gmail (Preporučeno) 

### Step 1: Pripremi Gmail Account
1. Otvori [myaccount.google.com](https://myaccount.google.com/)
2. Idi na **Security**
3. **Uključi 2-Step Verification** (ako nije već)

### Step 2: Kreiraj App Password
1. U Security sekciji, idi na **2-Step Verification**
2. Skrolaj dole do **App passwords**
3. Klikni **App passwords**
4. Iz dropdown-a odaberi:
   - **Select app**: `Mail`
   - **Select device**: `Other (Custom name)`
5. Unesi naziv: `Remis Fantasy`
6. Klikni **GENERATE**
7. **KOPIRAJ** 16-character password (format: `abcd efgh ijkl mnop`)

### Step 3: Gmail SMTP Settings
Koristit ćeš ove settings u environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # App password iz Step 2
SMTP_FROM=noreply@yourdomain.com  # ili your-gmail@gmail.com
```

---

## Option 2: SendGrid (Za production)

### Step 1: Registruj se na SendGrid
1. Idi na [sendgrid.com](https://sendgrid.com/)
2. Kreiraj free account (100 emails/day)

### Step 2: Kreiraj API Key
1. Idi na **Settings > API Keys**
2. Klikni **Create API Key**
3. Odaberi **Restricted Access**
4. Dodaj **Mail Send** permissions
5. Kopiraj API Key

### Step 3: SendGrid SMTP Settings
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

---

## Option 3: Mailgun (Alternative)

### Step 1: Registruj se na Mailgun
1. Idi na [mailgun.com](https://www.mailgun.com/)
2. Kreiraj free account

### Step 2: Dodaj Domain
1. Idi na **Domains**
2. Dodaj svoj domain i potvrdi DNS records

### Step 3: Mailgun SMTP Settings
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.com
SMTP_PASS=your-mailgun-smtp-password
SMTP_FROM=noreply@your-domain.com
```

---

## ✅ Testiranje Email-a

Kreiraću test endpoint da provjeriš da li email radi:

1. Pokreni aplikaciju
2. Idi na `/signup`
3. Unesi svoj email
4. Provjeri da li si dobio OTP kod

---

## 🚨 Česta pitanja

**Q: Gmail blokira slanje email-a?**
A: Provjeri da li koristiš App Password, ne običnu lozinku.

**Q: Emails idu u spam?**
A: Dodaj SPF i DKIM DNS records za svoj domain.

**Q: "Less secure app access"?**
A: Gmail je ukinuo ovu opciju. Mora se koristiti App Password.

---

**Sljedeći korak**: Environment Variables setup 👉