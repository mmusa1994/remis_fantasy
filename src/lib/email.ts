import * as nodemailer from "nodemailer";

// Type definition for user data
interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  team_name: string;
  league_type: string;
  h2h_league: boolean;
}

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email templates
const createPremiumTemplate = (userData: UserData) => `
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REMIS Fantasy - Premium Liga Potvrda</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .header {
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shine 3s infinite;
        }
        @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
            color: #1a1a1a;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-section {
            text-align: center;
            margin-bottom: 40px;
        }
        .welcome-section h2 {
            color: #ffd700;
            font-size: 24px;
            margin-bottom: 20px;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        .user-info {
            background: rgba(255, 215, 0, 0.1);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        .user-info h3 {
            color: #ffd700;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 215, 0, 0.3);
        }
        .info-label {
            font-weight: bold;
            color: #ffd700;
        }
        .info-value {
            color: #ffffff;
        }
        .code-section {
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        .code-section h3 {
            color: #1a1a1a;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: bold;
        }
        .access-code {
            background: #1a1a1a;
            color: #ffd700;
            font-size: 28px;
            font-weight: bold;
            padding: 20px;
            border-radius: 10px;
            letter-spacing: 3px;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            border: 3px solid #ffd700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }
        .footer {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 30px;
            text-align: center;
            border-top: 2px solid #ffd700;
        }
        .footer p {
            color: #cccccc;
            margin: 5px 0;
        }
        .contact-info {
            color: #ffd700;
            font-weight: bold;
        }
        .trophy-icon {
            font-size: 48px;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 REMIS FANTASY PREMIUM 🏆</h1>
        </div>
        
        <div class="content">
            <div class="welcome-section">
                <div class="trophy-icon">🏆</div>
                <h2>Dobrodošao u Premium Ligu!</h2>
                <p>Čestitamo! Uspješno si se registrovao za REMIS Fantasy Premium ligu 2025/26 sezone.</p>
            </div>
            
            <div class="user-info">
                <h3>📋 Tvoji Podaci</h3>
                <div class="info-row">
                    <span class="info-label">Ime:</span>
                    <span class="info-value">${userData.first_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Prezime:</span>
                    <span class="info-value">${userData.last_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${userData.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Telefon:</span>
                    <span class="info-value">${userData.phone}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ekipa:</span>
                    <span class="info-value">${userData.team_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Liga:</span>
                    <span class="info-value">Premium Liga (50€ / 100KM)</span>
                </div>
            </div>
            
            <div class="code-section">
                <h3>🔑 Kod za Pristup Premium Ligi</h3>
                <div class="access-code">premium_code</div>
                <p style="color: #1a1a1a; margin-top: 15px; font-weight: bold;">
                    Koristi ovaj kod za pristup Premium ligi!
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>REMIS Fantasy 2025/26</strong></p>
            <p class="contact-info">📧 Kontakt: info@remisfantasy.com</p>
            <p>Hvala ti na prijavi! 🚀</p>
        </div>
    </div>
</body>
</html>
`;

const createStandardTemplate = (userData: UserData) => `
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REMIS Fantasy - Standard Liga Potvrda</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .header {
            background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #0ea5e9 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shine 3s infinite;
        }
        @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
            color: #ffffff;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-section {
            text-align: center;
            margin-bottom: 40px;
        }
        .welcome-section h2 {
            color: #0ea5e9;
            font-size: 24px;
            margin-bottom: 20px;
            text-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
        }
        .user-info {
            background: rgba(14, 165, 233, 0.1);
            border: 2px solid #0ea5e9;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        .user-info h3 {
            color: #0ea5e9;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid rgba(14, 165, 233, 0.3);
        }
        .info-label {
            font-weight: bold;
            color: #0ea5e9;
        }
        .info-value {
            color: #ffffff;
        }
        .code-section {
            background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(14, 165, 233, 0.3);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        .code-section h3 {
            color: #ffffff;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: bold;
        }
        .access-code {
            background: #1a1a1a;
            color: #0ea5e9;
            font-size: 28px;
            font-weight: bold;
            padding: 20px;
            border-radius: 10px;
            letter-spacing: 3px;
            text-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
            border: 3px solid #0ea5e9;
            box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
        }
        .footer {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 30px;
            text-align: center;
            border-top: 2px solid #0ea5e9;
        }
        .footer p {
            color: #cccccc;
            margin: 5px 0;
        }
        .contact-info {
            color: #0ea5e9;
            font-weight: bold;
        }
        .trophy-icon {
            font-size: 48px;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚽ REMIS FANTASY STANDARD ⚽</h1>
        </div>
        
        <div class="content">
            <div class="welcome-section">
                <div class="trophy-icon">⚽</div>
                <h2>Dobrodošao u Standard Ligu!</h2>
                <p>Čestitamo! Uspješno si se registrovao za REMIS Fantasy Standard ligu 2025/26 sezone.</p>
            </div>
            
            <div class="user-info">
                <h3>📋 Tvoji Podaci</h3>
                <div class="info-row">
                    <span class="info-label">Ime:</span>
                    <span class="info-value">${userData.first_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Prezime:</span>
                    <span class="info-value">${userData.last_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${userData.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Telefon:</span>
                    <span class="info-value">${userData.phone}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ekipa:</span>
                    <span class="info-value">${userData.team_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Liga:</span>
                    <span class="info-value">Standard Liga (15€ / 30KM)</span>
                </div>
            </div>
            
            <div class="code-section">
                <h3>🔑 Kod za Pristup Standard Ligi</h3>
                <div class="access-code">standard_code</div>
                <p style="color: #ffffff; margin-top: 15px; font-weight: bold;">
                    Koristi ovaj kod za pristup Standard ligi!
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>REMIS Fantasy 2025/26</strong></p>
            <p class="contact-info">📧 Kontakt: info@remisfantasy.com</p>
            <p>Hvala ti na prijavi! 🚀</p>
        </div>
    </div>
</body>
</html>
`;

const createPremiumH2HTemplate = (userData: UserData) => `
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REMIS Fantasy - Premium + H2H Liga Potvrda</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .header {
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shine 3s infinite;
        }
        @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
            color: #1a1a1a;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-section {
            text-align: center;
            margin-bottom: 40px;
        }
        .welcome-section h2 {
            color: #ffd700;
            font-size: 24px;
            margin-bottom: 20px;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        .user-info {
            background: rgba(255, 215, 0, 0.1);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        .user-info h3 {
            color: #ffd700;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 215, 0, 0.3);
        }
        .info-label {
            font-weight: bold;
            color: #ffd700;
        }
        .info-value {
            color: #ffffff;
        }
        .premium-code-section {
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
            animation: pulse 2s infinite;
        }
        .h2h-code-section {
            background: linear-gradient(135deg, #87ceeb 0%, #b0e0e6 100%);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(135, 206, 235, 0.3);
            animation: pulse 2s infinite;
            animation-delay: 1s;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        .premium-code-section h3 {
            color: #1a1a1a;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: bold;
        }
        .h2h-code-section h3 {
            color: #1a1a1a;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: bold;
        }
        .access-code {
            background: #1a1a1a;
            font-size: 28px;
            font-weight: bold;
            padding: 20px;
            border-radius: 10px;
            letter-spacing: 3px;
            border: 3px solid;
            box-shadow: 0 0 20px;
        }
        .premium-code {
            color: #ffd700;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            border-color: #ffd700;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }
        .h2h-code {
            color: #87ceeb;
            text-shadow: 0 0 10px rgba(135, 206, 235, 0.5);
            border-color: #87ceeb;
            box-shadow: 0 0 20px rgba(135, 206, 235, 0.3);
        }
        .footer {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 30px;
            text-align: center;
            border-top: 2px solid #ffd700;
        }
        .footer p {
            color: #cccccc;
            margin: 5px 0;
        }
        .contact-info {
            color: #ffd700;
            font-weight: bold;
        }
        .trophy-icon {
            font-size: 48px;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        .league-info {
            background: rgba(255, 215, 0, 0.1);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .league-info h4 {
            color: #ffd700;
            margin-bottom: 10px;
        }
        .h2h-info {
            background: rgba(135, 206, 235, 0.1);
            border: 2px solid #87ceeb;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .h2h-info h4 {
            color: #87ceeb;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 REMIS FANTASY PREMIUM + H2H 🏆</h1>
        </div>
        
        <div class="content">
            <div class="welcome-section">
                <div class="trophy-icon">🏆</div>
                <h2>Dobrodošao u Premium + H2H Ligu!</h2>
                <p>Čestitamo! Uspješno si se registrovao za REMIS Fantasy Premium ligu i H2H dodatnu ligu 2025/26 sezone.</p>
            </div>
            
            <div class="user-info">
                <h3>📋 Tvoji Podaci</h3>
                <div class="info-row">
                    <span class="info-label">Ime:</span>
                    <span class="info-value">${userData.first_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Prezime:</span>
                    <span class="info-value">${userData.last_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${userData.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Telefon:</span>
                    <span class="info-value">${userData.phone}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ekipa:</span>
                    <span class="info-value">${userData.team_name}</span>
                </div>
            </div>
            
            <div class="league-info">
                <h4>🏆 Premium Liga (50€ / 100KM)</h4>
                <p>VIP liga s ekskluzivnim nagradama</p>
            </div>
            
            <div class="h2h-info">
                <h4>⚔️ H2H Liga (10€ / 20KM)</h4>
                <p>Head-to-Head dodatna liga sa posebnim nagradama</p>
            </div>
            
            <div class="premium-code-section">
                <h3>🔑 Kod za Pristup Premium Ligi</h3>
                <div class="access-code premium-code">premium_code</div>
                <p style="color: #1a1a1a; margin-top: 15px; font-weight: bold;">
                    Koristi ovaj kod za pristup Premium ligi!
                </p>
            </div>
            
            <div class="h2h-code-section">
                <h3>⚔️ Kod za Pristup H2H Ligi</h3>
                <div class="access-code h2h-code">h2h_code</div>
                <p style="color: #1a1a1a; margin-top: 15px; font-weight: bold;">
                    Koristi ovaj kod za pristup H2H ligi!
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>REMIS Fantasy 2025/26</strong></p>
            <p class="contact-info">📧 Kontakt: info@remisfantasy.com</p>
            <p>Hvala ti na prijavi! 🚀</p>
        </div>
    </div>
</body>
</html>
`;

const createStandardH2HTemplate = (userData: UserData) => `
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REMIS Fantasy - Standard + H2H Liga Potvrda</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .header {
            background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #0ea5e9 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shine 3s infinite;
        }
        @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
            color: #ffffff;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-section {
            text-align: center;
            margin-bottom: 40px;
        }
        .welcome-section h2 {
            color: #0ea5e9;
            font-size: 24px;
            margin-bottom: 20px;
            text-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
        }
        .user-info {
            background: rgba(14, 165, 233, 0.1);
            border: 2px solid #0ea5e9;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            text-align: center;
        }
        .user-info h3 {
            color: #0ea5e9;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid rgba(14, 165, 233, 0.3);
        }
        .info-label {
            font-weight: bold;
            color: #0ea5e9;
        }
        .info-value {
            color: #ffffff;
        }
        .standard-code-section {
            background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(14, 165, 233, 0.3);
            animation: pulse 2s infinite;
        }
        .h2h-code-section {
            background: linear-gradient(135deg, #87ceeb 0%, #b0e0e6 100%);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(135, 206, 235, 0.3);
            animation: pulse 2s infinite;
            animation-delay: 1s;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        .standard-code-section h3 {
            color: #ffffff;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: bold;
        }
        .h2h-code-section h3 {
            color: #1a1a1a;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: bold;
        }
        .access-code {
            background: #1a1a1a;
            font-size: 28px;
            font-weight: bold;
            padding: 20px;
            border-radius: 10px;
            letter-spacing: 3px;
            border: 3px solid;
            box-shadow: 0 0 20px;
        }
        .standard-code {
            color: #0ea5e9;
            text-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
            border-color: #0ea5e9;
            box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
        }
        .h2h-code {
            color: #87ceeb;
            text-shadow: 0 0 10px rgba(135, 206, 235, 0.5);
            border-color: #87ceeb;
            box-shadow: 0 0 20px rgba(135, 206, 235, 0.3);
        }
        .footer {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 30px;
            text-align: center;
            border-top: 2px solid #0ea5e9;
        }
        .footer p {
            color: #cccccc;
            margin: 5px 0;
        }
        .contact-info {
            color: #0ea5e9;
            font-weight: bold;
        }
        .trophy-icon {
            font-size: 48px;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        .league-info {
            background: rgba(14, 165, 233, 0.1);
            border: 2px solid #0ea5e9;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .league-info h4 {
            color: #0ea5e9;
            margin-bottom: 10px;
        }
        .h2h-info {
            background: rgba(135, 206, 235, 0.1);
            border: 2px solid #87ceeb;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .h2h-info h4 {
            color: #87ceeb;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚽ REMIS FANTASY STANDARD + H2H ⚽</h1>
        </div>
        
        <div class="content">
            <div class="welcome-section">
                <div class="trophy-icon">⚽</div>
                <h2>Dobrodošao u Standard + H2H Ligu!</h2>
                <p>Čestitamo! Uspješno si se registrovao za REMIS Fantasy Standard ligu i H2H dodatnu ligu 2025/26 sezone.</p>
            </div>
            
            <div class="user-info">
                <h3>📋 Tvoji Podaci</h3>
                <div class="info-row">
                    <span class="info-label">Ime:</span>
                    <span class="info-value">${userData.first_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Prezime:</span>
                    <span class="info-value">${userData.last_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${userData.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Telefon:</span>
                    <span class="info-value">${userData.phone}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ekipa:</span>
                    <span class="info-value">${userData.team_name}</span>
                </div>
            </div>
            
            <div class="league-info">
                <h4>⚽ Standard Liga (15€ / 30KM)</h4>
                <p>Klasična liga s osnovnim nagradama</p>
            </div>
            
            <div class="h2h-info">
                <h4>⚔️ H2H Liga (10€ / 20KM)</h4>
                <p>Head-to-Head dodatna liga sa posebnim nagradama</p>
            </div>
            
            <div class="standard-code-section">
                <h3>🔑 Kod za Pristup Standard Ligi</h3>
                <div class="access-code standard-code">standard_code</div>
                <p style="color: #ffffff; margin-top: 15px; font-weight: bold;">
                    Koristi ovaj kod za pristup Standard ligi!
                </p>
            </div>
            
            <div class="h2h-code-section">
                <h3>⚔️ Kod za Pristup H2H Ligi</h3>
                <div class="access-code h2h-code">h2h_code</div>
                <p style="color: #1a1a1a; margin-top: 15px; font-weight: bold;">
                    Koristi ovaj kod za pristup H2H ligi!
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>REMIS Fantasy 2025/26</strong></p>
            <p class="contact-info">📧 Kontakt: info@remisfantasy.com</p>
            <p>Hvala ti na prijavi! 🚀</p>
        </div>
    </div>
</body>
</html>
`;

// Function to send confirmation email
export const sendConfirmationEmail = async (userData: UserData) => {
  try {
    let emailTemplate = "";
    let subject = "";

    // Determine which template to use based on user selections
    if (userData.league_type === "premium" && userData.h2h_league) {
      emailTemplate = createPremiumH2HTemplate(userData);
      subject = "🏆 REMIS Fantasy - Potvrda Premium + H2H Lige";
    } else if (userData.league_type === "premium") {
      emailTemplate = createPremiumTemplate(userData);
      subject = "🏆 REMIS Fantasy - Potvrda Premium Lige";
    } else if (userData.league_type === "standard" && userData.h2h_league) {
      emailTemplate = createStandardH2HTemplate(userData);
      subject = "⚽ REMIS Fantasy - Potvrda Standard + H2H Lige";
    } else {
      emailTemplate = createStandardTemplate(userData);
      subject = "⚽ REMIS Fantasy - Potvrda Standard Lige";
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userData.email,
      subject: subject,
      html: emailTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
