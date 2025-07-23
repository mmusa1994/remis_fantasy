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
            background: #333;
            color: #F5D056;
            font-size: 24px;
            font-weight: bold;
            padding: 15px;
            border-radius: 6px;
            letter-spacing: 2px;
            margin: 10px 0;
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
                <div class="access-code">ufdndr</div>
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
            background: #333;
            color: #9EEBEB;
            font-size: 24px;
            font-weight: bold;
            padding: 15px;
            border-radius: 6px;
            letter-spacing: 2px;
            margin: 10px 0;
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
                <div class="access-code">ho2hco</div>
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
                <div class="access-code">ufdndr</div>
                <p style="color: #333; margin-top: 10px; font-weight: bold;">
                    Koristi ovaj kod za pristup Premium ligi!
                </p>
            </div>
            
            <div class="h2h-code-section">
                <h3>H2H Liga Kod</h3>
                <div class="access-code">5wieya</div>
                <p style="color: white; margin-top: 10px; font-weight: bold;">
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
            color: #333;
        }
        .info-value {
            color: #555;
        }
        .standard-code-section {
            background: #9EEBEB;
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
            </div>
            
            <div class="standard-code-section">
                <h3>Standard Liga Kod</h3>
                <div class="access-code">ho2hco</div>
                <p style="color: #333; margin-top: 10px; font-weight: bold;">
                    Koristi ovaj kod za pristup Standard ligi!
                </p>
            </div>
            
            <div class="h2h-code-section">
                <h3>H2H Liga Kod</h3>
                <div class="access-code">5wieya</div>
                <p style="color: white; margin-top: 10px; font-weight: bold;">
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
