# 🔐 Google OAuth Setup Guide

## Step 1: Go to Google Cloud Console

1. Otvori [Google Cloud Console](https://console.cloud.google.com/)
2. Prijavi se sa svojim Google računom

## Step 2: Kreiraj ili odaberi Project

### Ako nemaš project:
1. Klikni "Select a project" dropdown (gore lijevo)
2. Klikni "NEW PROJECT"
3. Unesi naziv: `Remis Fantasy Auth`
4. Klikni "CREATE"

### Ako imaš postojeći project:
1. Odaberi ga iz dropdown-a

## Step 3: Enable Google+ API (ili People API)

1. U lijvoj strani, idi na **APIs & Services > Library**
2. U search baru ukucaj: `Google+ API`
3. Klikni na **Google+ API**
4. Klikni **ENABLE**

*Napomena: Google+ API je deprecated, ali NextAuth ga još uvijek koristi. Alternativno možeš koristiti People API.*

## Step 4: Kreiraj OAuth 2.0 Credentials

1. Idi na **APIs & Services > Credentials**
2. Klikni **+ CREATE CREDENTIALS**
3. Odaberi **OAuth 2.0 Client IDs**

## Step 5: Konfiguraj OAuth consent screen (ako nije već)

Ako ti se prikaže poruka za consent screen:

1. Klikni **CONFIGURE CONSENT SCREEN**
2. Odaberi **External** (osim ako nemaš Google Workspace)
3. Klikni **CREATE**
4. Ispuni osnovne informacije:
   - **App name**: `Remis Fantasy`
   - **User support email**: tvoj email
   - **Developer contact information**: tvoj email
5. Klikni **SAVE AND CONTINUE**
6. Preskoči "Scopes" - klikni **SAVE AND CONTINUE**
7. Preskoči "Test users" - klikni **SAVE AND CONTINUE**
8. Klikni **BACK TO DASHBOARD**

## Step 6: Kreiraj OAuth Client ID

1. Vrati se na **APIs & Services > Credentials**
2. Klikni **+ CREATE CREDENTIALS > OAuth 2.0 Client IDs**
3. Odaberi **Application type**: **Web application**
4. Unesi **Name**: `Remis Fantasy Web Client`

## Step 7: Dodaj Authorized Redirect URIs

U **Authorized redirect URIs** sekciju dodaj:

### Za development:
```
http://localhost:3000/api/auth/callback/google
```

### Za production (zamijeni sa svojim domenom):
```
https://yourdomain.com/api/auth/callback/google
```

## Step 8: Kreiraj i kopiraj credentials

1. Klikni **CREATE**
2. **KOPIRAJ** i sačuvaj:
   - **Client ID** (počinje sa brojevima, završava se sa `.googleusercontent.com`)
   - **Client Secret** (kratka random string)

## ⚠️ VAŽNO:

- **NE DIJELI** Client Secret ni sa kim
- **NE COMMITUJ** u git repository
- Čuvaj ih za sljedeći korak (Environment Variables)

## 🧪 Testiranje

Kada završiš setup, možeš testirati OAuth flow na:
- Development: `http://localhost:3000/login`
- Production: `https://yourdomain.com/login`

---

**Sljedeći korak**: Dodavanje u Environment Variables 👉