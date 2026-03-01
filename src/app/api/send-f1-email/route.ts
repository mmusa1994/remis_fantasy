import { NextRequest, NextResponse } from "next/server";
import * as nodemailer from "nodemailer";
import { supabaseServer } from "@/lib/supabase-server";

function getTransporter() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    throw new Error(
      "Missing email credentials (SMTP_USER/SMTP_PASS) in environment",
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export function getF1CodesEmailHtml(firstName: string): string {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a2e !important; color: #ffffff !important; border-radius: 12px; overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important; background-color: #1a1a2e !important; padding: 40px 30px 20px; text-align: center;">
        <img src="https://remis-fantasy.com/images/rf-no-bg.png" alt="REMIS Fantasy" style="width: 120px; height: auto; margin-bottom: 16px;" />
        <img src="https://remis-fantasy.com/images/logos/f1.png" alt="F1" style="width: 80px; height: auto; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;" />
        <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 2px; color: #ffffff !important;">F1 FANTASY LEAGUE 2026</h1>
        <div style="width: 60px; height: 3px; background-color: #e10600 !important; margin: 16px auto 0;"></div>
      </div>

      <!-- Body -->
      <div style="padding: 30px; background-color: #1a1a2e !important;">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px; color: #ffffff !important;">Pozdrav ${firstName},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #ffffff !important;">
          Vasa registracija za <strong style="color: #ffffff !important;">F1 Fantasy 2026</strong> je potvrdjena i uplata je uspjesno primljena. Hvala vam na povjerenju!
        </p>

        <!-- League Code Box -->
        <div style="background-color: #16213e !important; border: 2px solid #e10600 !important; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #aaaaaa !important;">Kod lige</p>
          <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #e10600 !important;">C16BVMBB402</p>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="https://fantasy.formula1.com/en/leagues/join/C16BVMBB402" style="display: inline-block; background-color: #e10600 !important; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.5px;">Pristupi ligi</a>
        </div>

        <!-- Instructions -->
        <div style="background-color: #16213e !important; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #e10600 !important; text-transform: uppercase; letter-spacing: 1px;">Kako se pridruziti</p>
          <p style="margin: 0 0 6px; font-size: 14px; line-height: 1.8; color: #dddddd !important;">1. Otvorite <strong style="color: #ffffff !important;">fantasy.formula1.com</strong></p>
          <p style="margin: 0 0 6px; font-size: 14px; line-height: 1.8; color: #dddddd !important;">2. Kreirajte tim (ako vec nemate)</p>
          <p style="margin: 0 0 6px; font-size: 14px; line-height: 1.8; color: #dddddd !important;">3. Idite na <strong style="color: #ffffff !important;">Leagues</strong></p>
          <p style="margin: 0 0 6px; font-size: 14px; line-height: 1.8; color: #dddddd !important;">4. Kliknite <strong style="color: #ffffff !important;">Join a league</strong></p>
          <p style="margin: 0 0 6px; font-size: 14px; line-height: 1.8; color: #dddddd !important;">5. Unesite kod: <strong style="color: #e10600 !important;">C16BVMBB402</strong></p>
          <p style="margin: 0; font-size: 14px; line-height: 1.8; color: #dddddd !important;">6. Potvrdite pristup ligi</p>
        </div>

        <!-- Divider -->
        <div style="width: 100%; height: 1px; background-color: #2a2a4a !important; margin: 24px 0;"></div>

        <!-- Footer -->
        <div style="text-align: center;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #888888 !important;">Za pitanja ili pomoc:</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #aaaaaa !important;">remisfantasy16@gmail.com</p>
          <p style="margin: 0 0 16px; font-size: 13px; color: #aaaaaa !important;">Instagram: @remis_fantasy</p>
          <p style="margin: 0; font-size: 11px; color: #555555 !important;">REMIS Fantasy — F1 Fantasy League 2026</p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailType, registrationId, userData } = body;

    if (emailType === "f1_codes") {
      // Idempotency check
      const { data: existingRegistration } = await supabaseServer
        .from("f1_registrations_25_26")
        .select("*")
        .eq("id", registrationId)
        .single();

      if (existingRegistration?.codes_email_sent) {
        return NextResponse.json({
          success: true,
          alreadySent: true,
          message: "F1 codes email was already sent",
          registration: existingRegistration,
        });
      }

      const transporter = getTransporter();
      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: userData.email,
        subject: "F1 Fantasy League 2026 - Kod za pristup | REMIS Fantasy",
        html: getF1CodesEmailHtml(userData.first_name),
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (e) {
        console.error("Failed to send F1 codes email:", e);
        throw new Error("Failed to send F1 codes email");
      }

      // Update DB
      const { data: updatedRegistration } = await supabaseServer
        .from("f1_registrations_25_26")
        .update({
          codes_email_sent: true,
          codes_email_sent_at: new Date().toISOString(),
        })
        .eq("id", registrationId)
        .select()
        .single();

      return NextResponse.json({
        success: true,
        message: "F1 codes email sent successfully",
        registration: updatedRegistration,
      });
    }

    return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
  } catch (error: unknown) {
    console.error("F1 email sending error:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
