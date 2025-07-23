import { NextRequest, NextResponse } from "next/server";
import {
  sendConfirmationEmail,
  sendAdminNotificationEmail,
  sendRegistrationConfirmationEmail,
} from "@/lib/email";
import { supabase } from "@/lib/supabase";
import { registrationLimiter } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    const rateLimitResult = registrationLimiter.isAllowed(clientIP);
    
    if (!rateLimitResult.allowed) {
      const resetTimeMinutes = Math.ceil((rateLimitResult.resetTime! - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Previše zahtjeva. Pokušajte ponovo za ${resetTimeMinutes} minuta.` }, 
        { status: 429 }
      );
    }

    const body = await request.json();
    const { userData, emailType = "codes", registrationId, recaptchaToken } = body;

    if (recaptchaToken) {
      const recaptchaResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
        { method: 'POST' }
      );
      
      const recaptchaData = await recaptchaResponse.json();
      
      if (!recaptchaData.success) {
        return NextResponse.json(
          { error: "reCAPTCHA verifikacija neuspešna" }, 
          { status: 400 }
        );
      }
    }

    if (!userData || !userData.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let result;
    let adminResult;

    // Send different email types based on the emailType parameter
    switch (emailType) {
      case "registration":
        // Send registration confirmation to user (without codes)
        result = await sendRegistrationConfirmationEmail(userData);

        // Send admin notification with muhamed.musa1994@gmail.com
        adminResult = await sendAdminNotificationEmail(
          userData,
          "muhamed.musa1994@gmail.com"
        );

        // Update database to mark registration email as sent
        if (registrationId) {
          await supabase
            .from("registration_25_26")
            .update({
              registration_email_sent: true,
              registration_email_sent_at: new Date().toISOString(),
            })
            .eq("id", registrationId);
        }
        break;

      case "codes":
        // Send confirmation email with access codes
        result = await sendConfirmationEmail(userData);

        // Update database to mark codes email as sent
        if (registrationId) {
          const packageType =
            userData.league_type === "premium" && userData.h2h_league
              ? "premium_h2h"
              : userData.league_type === "premium"
              ? "premium"
              : userData.league_type === "standard" && userData.h2h_league
              ? "standard_h2h"
              : "standard";

          await supabase
            .from("registration_25_26")
            .update({
              codes_email_sent: true,
              codes_email_sent_at: new Date().toISOString(),
              email_template_type: packageType,
            })
            .eq("id", registrationId);
        }
        break;

      default:
        // Default to sending codes email
        result = await sendConfirmationEmail(userData);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
        adminMessageId: adminResult?.messageId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
