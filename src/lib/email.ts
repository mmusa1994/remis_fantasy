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
            padding: 20px;
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            background: #F5D056;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .content {
            padding: 30px 20px;
        }
        .welcome-text {
            text-align: center;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.6;
        }
        .info-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .info-section h3 {
            color: #333;
            margin: 0 0 15px 0;
            font-size: 18px;
            text-align: center;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        .info-value {
            color: #333;
        }
        .code-section {
            background: #F5D056;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
        }
        .code-section h3 {
            color: #333;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .access-code {
            background: #1a1a1a !important;
            color: #ffffff !important;
            font-size: 28px !important;
            font-weight: bold !important;
            font-family: 'Courier New', 'Monaco', 'Lucida Console', monospace !important;
            padding: 20px 15px !important;
            border-radius: 8px !important;
            letter-spacing: 3px !important;
            margin: 15px 0 !important;
            border: 3px solid #F5D056 !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
            text-align: center !important;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
            -webkit-text-fill-color: #ffffff !important;
            display: block !important;
            min-height: 50px !important;
            line-height: 1.2 !important;
        }
        .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Premium Liga</h1>
        </div>
        
        <div class="content">
            <div class="welcome-text">
                <p>Čestitamo! Uspješno si se registrovao za REMIS Fantasy Premium ligu 2025/26 sezone.</p>
            </div>
            
            <div class="info-section">
                <h3>Tvoji Podaci</h3>
                <div class="info-row">
                    <span class="info-label">Ime:</span>
                    <span class="info-value"> ${
                      userData.first_name || "N/A"
                    }</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Prezime:</span>
                    <span class="info-value"> ${
                      userData.last_name || "N/A"
                    }</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value"> ${userData.email || "N/A"}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Telefon:</span>
                    <span class="info-value"> ${userData.phone || "N/A"}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ekipa:</span>
                    <span class="info-value"> ${
                      userData.team_name || "N/A"
                    }</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Liga:</span>
                    <span class="info-value">Premium Liga (50€ / 100KM)</span>
                </div>
            </div>
            
            <div class="code-section">
                <h3>Kod za Pristup</h3>
                <div class="access-code premium-code">ufdndr</div>
                <p style="color: #333; margin-top: 10px; font-weight: bold;">
                    Koristi ovaj kod za pristup Premium ligi!
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>REMIS Fantasy 2025/26</strong></p>
            <p>Kontakt: info@remisfantasy.com</p>
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
            padding: 20px;
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            background: #9EEBEB;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .content {
            padding: 30px 20px;
        }
        .welcome-text {
            text-align: center;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.6;
        }
        .info-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .info-section h3 {
            color: #333;
            margin: 0 0 15px 0;
            font-size: 18px;
            text-align: center;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        .info-value {
            color: #333;
        }
        .code-section {
            background: #9EEBEB;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
        }
        .code-section h3 {
            color: #333;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .access-code {
            background: #1a1a1a !important;
            color: #ffffff !important;
            font-size: 28px !important;
            font-weight: bold !important;
            font-family: 'Courier New', 'Monaco', 'Lucida Console', monospace !important;
            padding: 20px 15px !important;
            border-radius: 8px !important;
            letter-spacing: 3px !important;
            margin: 15px 0 !important;
            border: 3px solid #4FC3F7 !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
            text-align: center !important;
            -webkit-text-fill-color: #ffffff !important;
            display: block !important;
            min-height: 50px !important;
            line-height: 1.2 !important;
        }
        .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Standard Liga</h1>
        </div>
        
        <div class="content">
            <div class="welcome-text">
                <p>Čestitamo! Uspješno si se registrovao za REMIS Fantasy Standard ligu 2025/26 sezone.</p>
            </div>
            
            <div class="info-section">
                <h3>Tvoji Podaci</h3>
                <div class="info-row">
                    <span class="info-label">Ime:</span>
                    <span class="info-value"> ${
                      userData.first_name || "N/A"
                    }</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Prezime:</span>
                    <span class="info-value"> ${
                      userData.last_name || "N/A"
                    }</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value"> ${userData.email || "N/A"}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Telefon:</span>
                    <span class="info-value"> ${userData.phone || "N/A"}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ekipa:</span>
                    <span class="info-value"> ${
                      userData.team_name || "N/A"
                    }</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Liga:</span>
                    <span class="info-value">Standard Liga (15€ / 30KM)</span>
                </div>
            </div>
            
            <div class="code-section">
                <h3>Kod za Pristup</h3>
                <div class="access-code standard-code">ho2hco</div>
                <p style="color: #333; margin-top: 10px; font-weight: bold;">
                    Koristi ovaj kod za pristup Standard ligi!
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>REMIS Fantasy 2025/26</strong></p>
            <p>Kontakt: info@remisfantasy.com</p>
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
            padding: 20px;
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            background: #F5D056;
            padding: 30px 20px;
            text-align: center;
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
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .content {
            padding: 30px 20px;
        }
        .welcome-text {
            text-align: center;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.6;
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
            color: #333;
        }
        .info-value {
            color: #555;
        }
        .premium-code-section {
            background: #F5D056;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
        }
        .h2h-code-section {
            background: #FF0C0C;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
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
            color: #ffffff !important;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
        }
        .access-code {
            background: #1a1a1a !important;
            font-family: 'Courier New', 'Monaco', 'Lucida Console', monospace !important;
            font-size: 32px !important;
            font-weight: bold !important;
            padding: 25px 20px !important;
            border-radius: 12px !important;
            letter-spacing: 4px !important;
            border: 4px solid !important;
            box-shadow: 0 6px 15px rgba(0,0,0,0.3) !important;
            margin: 20px 0 !important;
            text-align: center !important;
            display: block !important;
            width: auto !important;
            min-height: 60px !important;
            line-height: 1.2 !important;
        }
        .premium-code {
            color: #ffffff !important;
            background: #1a1a1a !important;
            border-color: #ffd700 !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
            -webkit-text-fill-color: #ffffff !important;
        }
        .h2h-code {
            color: #ffffff !important;
            background: #1a1a1a !important;
            border-color: #ff4444 !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
            -webkit-text-fill-color: #ffffff !important;
        }
        .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
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
            <h1>Premium + H2H Liga</h1>
        </div>
        
        <div class="content">
            <div class="welcome-text">
                <p>Čestitamo! Uspješno si se registrovao za REMIS Fantasy Premium ligu i H2H dodatnu ligu 2025/26 sezone.</p>
            </div>
            
            <div class="info-section">
                <h3>Tvoji Podaci</h3>
                <div class="info-row">
                    <span class="info-label">Ime:</span>
                    <span class="info-value"> ${
                      userData.first_name || "N/A"
                    }</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Prezime:</span>
                    <span class="info-value"> ${
                      userData.last_name || "N/A"
                    }</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value"> ${userData.email || "N/A"}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Telefon:</span>
                    <span class="info-value"> ${userData.phone || "N/A"}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ekipa:</span>
                    <span class="info-value"> ${
                      userData.team_name || "N/A"
                    }</span>
                </div>
            </div>
            
            <div class="premium-code-section">
                <h3>Premium Liga Kod</h3>
                <div class="access-code premium-code">ufdndr</div>
                <p style="color: #333; margin-top: 15px; font-weight: bold; font-size: 14px;">
                    Koristi ovaj kod za pristup Premium ligi!
                </p>
            </div>
            
            <div class="h2h-code-section">
                <h3>H2H Liga Kod</h3>
                <div class="access-code h2h-code" style="background: #1a1a1a !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important; font-family: 'Courier New', 'Monaco', 'Lucida Console', monospace !important; font-size: 28px !important; font-weight: bold !important; padding: 20px 15px !important; border-radius: 8px !important; letter-spacing: 3px !important; border: 3px solid #8B0000 !important; box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important; margin: 15px 0 !important; text-align: center !important; display: block !important; min-height: 50px !important; line-height: 1.2 !important;">u79pvi</div>
                <p style="color: #333; margin-top: 15px; font-weight: bold; font-size: 14px;">
                    Koristi ovaj kod za pristup H2H ligi!
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>REMIS Fantasy 2025/26</strong></p>
            <p>Kontakt: info@remisfantasy.com</p>
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
            padding: 20px;
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            background: #9EEBEB;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .content {
            padding: 30px 20px;
        }
        .welcome-text {
            text-align: center;
            margin-bottom: 30px;
            color: #666;
            line-height: 1.6;
        }
        .info-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .info-section h3 {
            color: #333;
            margin: 0 0 15px 0;
            font-size: 18px;
            text-align: center;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        .info-value {
            color: #333;
        }
        .standard-code-section {
            background: #9EEBEB;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
        }
        .h2h-code-section {
            background: #8B0000;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
        }
        .standard-code-section h3 {
            color: #333;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .h2h-code-section h3 {
            color: #ffffff !important;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .access-code {
            background: #1a1a1a !important;
            color: #ffffff !important;
            font-size: 28px !important;
            font-weight: bold !important;
            font-family: 'Courier New', 'Monaco', 'Lucida Console', monospace !important;
            padding: 20px 15px !important;
            border-radius: 8px !important;
            letter-spacing: 3px !important;
            margin: 15px 0 !important;
            text-align: center !important;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
            -webkit-text-fill-color: #ffffff !important;
            display: block !important;
            min-height: 50px !important;
            line-height: 1.2 !important;
        }
        .standard-code {
            border: 3px solid #4FC3F7 !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
        }
        .h2h-code {
            border: 3px solid #8B0000 !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
        }
        .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Standard + H2H Liga</h1>
        </div>
        
        <div class="content">
            <div class="welcome-text">
                <p>Čestitamo! Uspješno si se registrovao za REMIS Fantasy Standard ligu i H2H dodatnu ligu 2025/26 sezone.</p>
            </div>
            
            <div class="info-section">
                <h3>Tvoji Podaci</h3>
                <div class="info-row">
                    <span class="info-label">Ime:</span>
                    <span class="info-value"> ${
                      userData.first_name || "N/A"
                    }</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Prezime:</span>
                    <span class="info-value"> ${
                      userData.last_name || "N/A"
                    }</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value"> ${userData.email || "N/A"}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Telefon:</span>
                    <span class="info-value"> ${userData.phone || "N/A"}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ekipa:</span>
                    <span class="info-value"> ${
                      userData.team_name || "N/A"
                    }</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Liga:</span>
                    <span class="info-value">Standard Liga (15€ / 30KM) + H2H Liga</span>
                </div>
            </div>
            
            <div class="standard-code-section">
                <h3>Standard Liga Kod</h3>
                <div class="access-code standard-code">ho2hco</div>
                <p style="color: #333; margin-top: 10px; font-weight: bold;">
                    Koristi ovaj kod za pristup Standard ligi!
                </p>
            </div>
            
            <div class="h2h-code-section">
                <h3>H2H Liga Kod</h3>
                <div class="access-code h2h-code">u79pvi</div>
                <p style="color: #ffffff; margin-top: 10px; font-weight: bold;">
                    Koristi ovaj kod za pristup H2H ligi!
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>REMIS Fantasy 2025/26</strong></p>
            <p>Kontakt: info@remisfantasy.com</p>
        </div>
    </div>
</body>
</html>
`;

// Admin confirmation template
const createAdminConfirmationTemplate = (userData: UserData) => `
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REMIS Fantasy - Nova Registracija</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 30px 20px;
        }
        .alert-section {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            text-align: center;
        }
        .alert-section h2 {
            color: #856404;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .alert-section p {
            color: #856404;
            margin: 0;
            font-size: 16px;
        }
        .user-details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 20px 0;
        }
        .user-details h3 {
            color: #333;
            margin: 0 0 20px 0;
            font-size: 20px;
            text-align: center;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-label {
            font-weight: bold;
            color: #495057;
            min-width: 120px;
        }
        .detail-value {
            color: #333;
            font-weight: 500;
        }
        .league-info {
            background: ${
              userData.league_type === "premium" ? "#fff8e1" : "#e3f2fd"
            };
            border: 2px solid ${
              userData.league_type === "premium" ? "#ffc107" : "#2196f3"
            };
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .league-info h4 {
            color: ${
              userData.league_type === "premium" ? "#ff8f00" : "#1976d2"
            };
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        .league-price {
            font-size: 24px;
            font-weight: bold;
            color: ${
              userData.league_type === "premium" ? "#ff8f00" : "#1976d2"
            };
        }
        .h2h-badge {
            background: #ff5722;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            display: inline-block;
            margin-top: 10px;
        }
        .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
        }
        .timestamp {
            color: #6c757d;
            font-size: 14px;
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Nova Registracija</h1>
            <p>REMIS Fantasy Admin Panel</p>
        </div>
        
        <div class="content">
            <div class="alert-section">
                <h2>🔔 Notification</h2>
                <p>Registrovan je novi korisnik na REMIS Fantasy platform</p>
            </div>
            
            <div class="user-details">
                <h3>Korisničke Informacije</h3>
                <div class="detail-row">
                    <span class="detail-label">Ime i Prezime:</span>
                    <span class="detail-value">${userData.first_name} ${
  userData.last_name
}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${userData.email}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Telefon:</span>
                    <span class="detail-value">${userData.phone}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Naziv Tima:</span>
                    <span class="detail-value">${userData.team_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tip Lige:</span>
                    <span class="detail-value">${
                      userData.league_type === "premium"
                        ? "Premium Liga"
                        : "Standard Liga"
                    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">H2H Liga:</span>
                    <span class="detail-value">${
                      userData.h2h_league ? "Da" : "Ne"
                    }</span>
                </div>
            </div>
            
            <div class="league-info">
                <h4>${
                  userData.league_type === "premium"
                    ? "🏆 Premium Liga"
                    : "⚽ Standard Liga"
                }</h4>
                <div class="league-price">
                    ${
                      userData.league_type === "premium"
                        ? "50€ / 100KM"
                        : "15€ / 30KM"
                    }
                </div>
                ${
                  userData.h2h_league
                    ? '<div class="h2h-badge">+ H2H Liga</div>'
                    : ""
                }
            </div>
            
            <div class="timestamp">
                <p>Registracija izvršena: ${new Date().toLocaleString("sr-RS", {
                  timeZone: "Europe/Belgrade",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>REMIS Fantasy Admin Panel</strong></p>
            <p>Automatska notifikacija sistema</p>
        </div>
    </div>
</body>
</html>
`;

// Registration confirmation template (simple confirmation)
const createRegistrationConfirmationTemplate = (userData: UserData) => `
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REMIS Fantasy - Registracija Uspješna</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .success-icon {
            font-size: 64px;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .success-message {
            font-size: 18px;
            color: #333;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .user-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
            text-align: left;
        }
        .user-info h3 {
            color: #4CAF50;
            margin: 0 0 20px 0;
            font-size: 20px;
            text-align: center;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        .info-value {
            color: #333;
        }
        .next-steps {
            background: #e3f2fd;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
        }
        .next-steps h3 {
            color: #1976d2;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .next-steps p {
            color: #333;
            line-height: 1.5;
            margin: 10px 0;
        }
        .highlight {
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
        }
        .highlight p {
            margin: 0;
            color: #e65100;
            font-weight: 500;
        }
        .footer {
            background: #333;
            color: white;
            padding: 25px;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Registracija Uspješna!</h1>
        </div>
        
        <div class="content">
            <div class="success-message">
                <p>Pozdrav ${userData.first_name}!</p>
                <p>Tvoja registracija za REMIS Fantasy ${
                  userData.league_type === "premium" ? "Premium" : "Standard"
                } ligu je uspješno primljena.</p>
            </div>
            
            <div class="user-info">
                <h3>Potvrda Registracije</h3>
                <div class="info-row">
                    <span class="info-label">Ime:</span>
                    <span class="info-value">${userData.first_name} ${
  userData.last_name
}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${userData.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tim:</span>
                    <span class="info-value">${userData.team_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Liga:</span>
                    <span class="info-value">${
                      userData.league_type === "premium"
                        ? "Premium Liga (50€/100KM)"
                        : "Standard Liga (15€/30KM)"
                    }</span>
                </div>
                ${
                  userData.h2h_league
                    ? '<div class="info-row"><span class="info-label">H2H Liga:</span><span class="info-value">Uključena</span></div>'
                    : ""
                }
            </div>
            
            <div class="next-steps">
                <h3>Sledeći Koraci</h3>
                <p>• Naš tim će pregledati tvoju registraciju</p>
                <p>• Uskoro ćeš primiti email sa pristupnim kodovima</p>
                <p>• Kodovi će ti omogućiti pristup ligama na platformi</p>
            </div>
            
            <div class="highlight">
                <p><strong>Važno:</strong> Čuvaj sve email-ove koje ćeš primiti jer sadrže pristupne kodove potrebne za igranje!</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>REMIS Fantasy 2025/26</strong></p>
            <p>Kontakt: info@remisfantasy.com</p>
            <p>Hvala ti što si dio naše zajednice! 🎉</p>
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

// Function to send admin notification email
export const sendAdminNotificationEmail = async (
  userData: UserData,
  adminEmail: string = process.env.ADMIN_EMAIL || "admin@remisfantasy.com"
) => {
  try {
    const emailTemplate = createAdminConfirmationTemplate(userData);
    const subject = `🔔 Nova Registracija - ${userData.first_name} ${
      userData.last_name
    } (${userData.league_type.toUpperCase()})`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: subject,
      html: emailTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Admin notification email sent successfully:", result);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending admin notification email:", error);
    throw error;
  }
};

// Function to send registration confirmation email (simple confirmation without access codes)
export const sendRegistrationConfirmationEmail = async (userData: UserData) => {
  try {
    const emailTemplate = createRegistrationConfirmationTemplate(userData);
    const subject = `✅ REMIS Fantasy - Registracija Potvrđena`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userData.email,
      subject: subject,
      html: emailTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Registration confirmation email sent successfully:", result);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending registration confirmation email:", error);
    throw error;
  }
};
