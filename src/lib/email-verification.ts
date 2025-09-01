import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email: string, otp: string, name?: string): Promise<boolean> {
  try {
    const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - Remis Fantasy</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-code { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-number { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 Remis Fantasy</h1>
          <h2>Email Verification</h2>
        </div>
        <div class="content">
          <h3>Hello${name ? ` ${name}` : ''}!</h3>
          <p>Thank you for joining Remis Fantasy! To complete your registration, please verify your email address using the OTP code below:</p>
          
          <div class="otp-code">
            <p style="margin: 0; font-size: 16px; color: #666;">Your verification code is:</p>
            <div class="otp-number">${otp}</div>
            <p style="margin: 0; font-size: 14px; color: #666;">This code expires in 10 minutes</p>
          </div>
          
          <p>Enter this code in the verification form to activate your account and start using our AI-powered FPL analysis features.</p>
          
          <p style="color: #666; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Remis Fantasy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`;

    const mailOptions = {
      from: `"Remis Fantasy" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify Your Email - Remis Fantasy",
      html: emailTemplate,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
}

export async function createEmailVerification(email: string): Promise<{ otp: string; success: boolean }> {
  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return { otp: "", success: false };
    }

    // Clean up old verifications for this email
    await supabase
      .from("email_verifications")
      .delete()
      .eq("user_id", email); // We'll use email as temp user_id for pending verifications

    // Create verification record
    const { error } = await supabase
      .from("email_verifications")
      .insert({
        user_id: email, // Temporary - will be updated when user is created
        otp,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error("Error creating verification:", error);
      return { otp: "", success: false };
    }

    return { otp, success: true };
  } catch (error) {
    console.error("Error in createEmailVerification:", error);
    return { otp: "", success: false };
  }
}

export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  try {
    const { data: verification } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("user_id", email) // email is used as temp user_id
      .eq("otp", otp)
      .gt("expires_at", new Date().toISOString())
      .is("verified_at", null)
      .single();

    return !!verification;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  try {
    const welcomeTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Remis Fantasy!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 Welcome to Remis Fantasy!</h1>
        </div>
        <div class="content">
          <h3>Hello ${name}!</h3>
          <p>Welcome to the ultimate Fantasy Premier League companion! Your account has been successfully created and you're ready to take your FPL game to the next level.</p>
          
          <div class="feature">
            <h4>🤖 AI Team Analysis</h4>
            <p>Get personalized FPL advice powered by real-time data and advanced AI. Make smarter transfers, captaincy choices, and strategic decisions.</p>
          </div>
          
          <div class="feature">
            <h4>📊 Advanced Analytics</h4>
            <p>Access detailed player statistics, form analysis, and fixture difficulty ratings to optimize your team performance.</p>
          </div>
          
          <div class="feature">
            <h4>🎯 Free Tier Benefits</h4>
            <p>Start with 3 free AI questions per week. Need more? Check out our affordable premium plans for unlimited access!</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/premier-league/ai-team-analysis" class="button">Start Using AI Analysis</a>
          </div>
          
          <p>Ready to dominate your mini-leagues? Log in and start exploring all the features Remis Fantasy has to offer!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Remis Fantasy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`;

    const mailOptions = {
      from: `"Remis Fantasy" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to Remis Fantasy! 🏆",
      html: welcomeTemplate,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}