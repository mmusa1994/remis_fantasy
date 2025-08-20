import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import {
  sendConfirmationEmail,
  sendAdminNotificationEmail,
  sendRegistrationConfirmationEmail,
} from "@/lib/email";
import { supabaseServer } from "@/lib/supabase-server";
import { registrationLimiter } from "@/lib/rate-limiter";

// Validate required environment variables
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

if (!recaptchaSecretKey) {
  throw new Error("Missing env var RECAPTCHA_SECRET_KEY");
}

export async function POST(request: NextRequest) {
  try {
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitResult = registrationLimiter.isAllowed(clientIP);

    if (!rateLimitResult.allowed) {
      // Robust reset time calculation with fallback
      const resetTime = rateLimitResult.resetTime || Date.now();
      const timeDifferenceMs = resetTime - Date.now();
      const computedMinutes = Math.ceil(timeDifferenceMs / 60000);
      const resetTimeMinutes = Math.max(computedMinutes, 0);

      return NextResponse.json(
        {
          error: `Previše zahtjeva. Pokušajte ponovo za ${resetTimeMinutes} minuta.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      userData,
      emailType = "codes",
      registrationId,
      recaptchaToken,
    } = body;

    // Get current session for authorization checks
    const session = await getServerSession(authOptions);

    // Authorization guard: codes email requires admin session
    if (emailType === "codes") {
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized: Admin session required for codes email" },
          { status: 401 }
        );
      }
    }

    // For public registration flows, require reCAPTCHA if no admin session
    if (emailType === "registration" && !session && !recaptchaToken) {
      return NextResponse.json(
        { error: "reCAPTCHA token required for public registration" },
        { status: 400 }
      );
    }

    if (recaptchaToken) {
      const recaptchaResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptchaToken}`,
        { method: "POST" }
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
    let updatedRegistration = null;

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
          await supabaseServer
            .from("registration_25_26")
            .update({
              registration_email_sent: true,
              registration_email_sent_at: new Date().toISOString(),
            })
            .eq("id", registrationId);
        }
        break;

      case "codes":
        // Check if codes email was already sent (idempotency check)
        if (registrationId) {
          const { data: existingRegistration } = await supabaseServer
            .from("registration_25_26")
            .select("codes_email_sent, codes_email_sent_at")
            .eq("id", registrationId)
            .single();

          if (existingRegistration?.codes_email_sent) {
            return NextResponse.json(
              {
                success: true,
                message: "Codes email was already sent",
                alreadySent: true,
                sentAt: existingRegistration.codes_email_sent_at,
              },
              { status: 200 }
            );
          }
        }

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

          const { data, error } = await supabaseServer
            .from("registration_25_26")
            .update({
              codes_email_sent: true,
              codes_email_sent_at: new Date().toISOString(),
              email_template_type: packageType,
            })
            .eq("id", registrationId)
            .select()
            .single();

          if (error) {
            console.error("Error updating registration:", error);
            throw new Error("Failed to update registration status");
          }

          updatedRegistration = data;
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
        registration: updatedRegistration,
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
