import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Reuse SMTP configuration (same as email-verification)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendPasswordResetEmail(
  email: string,
  otp: string,
  name?: string
): Promise<boolean> {
  try {
    const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - Remis Fantasy</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-code { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-number { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 Remis Fantasy</h1>
          <h2>Password Reset</h2>
        </div>
        <div class="content">
          <h3>Hello${name ? ` ${name}` : ""}!</h3>
          <p>We received a request to reset the password for your Remis Fantasy account. Use the OTP code below to complete the process:</p>
          <div class="otp-code">
            <p style="margin: 0; font-size: 16px; color: #666;">Your password reset code is:</p>
            <div class="otp-number">${otp}</div>
            <p style="margin: 0; font-size: 14px; color: #666;">This code expires in 10 minutes</p>
          </div>
          <p>If you did not request a password reset, you can ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Remis Fantasy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`;

    const mailOptions = {
      from: `"Remis Fantasy" <${
        process.env.SMTP_FROM || process.env.SMTP_USER
      }>`,
      to: email,
      subject: "Reset Your Password - Remis Fantasy",
      html: emailTemplate,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
}

export async function createPasswordReset(email: string): Promise<{ success: boolean; otp?: string; userName?: string }>{
  try {
    const inputEmail = String(email).trim();
    // Find user by email (any provider)
    const { data: user } = await supabase
      .from("users")
      .select("id, name, provider")
      .ilike("email", inputEmail)
      .single();

    if (!user) {
      // Do not reveal existence; return success=false but let API decide response
      return { success: false };
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up expired verifications
    await supabase
      .from("email_verifications")
      .delete()
      .lt("expires_at", new Date().toISOString());

    // Create verification record tied to user
    const { error } = await supabase
      .from("email_verifications")
      .insert({
        user_id: user.id,
        otp,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error("Error creating password reset verification:", error);
      return { success: false };
    }

    return { success: true, otp, userName: user.name };
  } catch (error) {
    console.error("Error in createPasswordReset:", error);
    return { success: false };
  }
}

export async function resetPasswordWithOTP(email: string, otp: string, newPassword: string): Promise<{ success: boolean }>{
  try {
    const inputEmail = String(email).trim();
    const { data: user } = await supabase
      .from("users")
      .select("id, provider")
      .ilike("email", inputEmail)
      .single();

    if (!user) {
      return { success: false };
    }

    // Verify OTP belongs to this user and is valid
    const { data: verifications } = await supabase
      .from("email_verifications")
      .select("id, otp, expires_at, verified_at")
      .eq("user_id", user.id)
      .eq("otp", otp)
      .gt("expires_at", new Date().toISOString())
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    const verification = Array.isArray(verifications) ? verifications[0] : null;
    if (!verification) {
      return { success: false };
    }

    // Update password
    const hashed = await bcrypt.hash(newPassword, 12);
    const { error: updateErr } = await supabase
      .from("users")
      .update({ password_hash: hashed, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateErr) {
      console.error("Failed to update password:", updateErr);
      return { success: false };
    }

    // Mark verification as used
    await supabase
      .from("email_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id);

    return { success: true };
  } catch (error) {
    console.error("Error in resetPasswordWithOTP:", error);
    return { success: false };
  }
}
