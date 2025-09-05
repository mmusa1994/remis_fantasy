import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "muhamed.musa1994@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailType, registrationId, recaptchaToken, userData } = body;

    // Verify reCAPTCHA
    if (recaptchaToken) {
      try {
        const recaptchaResponse = await fetch(
          "https://www.google.com/recaptcha/api/siteverify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
          }
        );

        const recaptchaResult = await recaptchaResponse.json();
        if (!recaptchaResult.success) {
          return NextResponse.json(
            { error: "reCAPTCHA verification failed" },
            { status: 400 }
          );
        }
      } catch (recaptchaError) {
        console.error("reCAPTCHA verification error:", recaptchaError);
        // Continue without blocking registration if reCAPTCHA service fails
      }
    }

    if (emailType === "champions_registration") {
      // Send registration confirmation email to user
      const userEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "REMIS Fantasy <noreply@remisfantasy.com>",
          to: [userData.email],
          subject:
            "✅ Champions League Fantasy Registracija Potvrđena - REMIS Fantasy 2025/26",
          html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%); color: white; border-radius: 20px; overflow: hidden;">
                <div style="padding: 40px 30px; text-align: center;">
                  <div style="background: white; color: #1e3a8a; padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🏆 CHAMPIONS LEAGUE FANTASY 🏆</h1>
                    <h2 style="margin: 10px 0 0 0; color: #7c3aed; font-size: 18px;">Season 2025/26</h2>
                  </div>
                  
                  <h3 style="color: #fbbf24; margin: 0 0 20px 0; font-size: 20px;">Dobrodošli ${
                    userData.first_name
                  }!</h3>
                  
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                    Vaša registracija za <strong>Champions League Fantasy 2025/26</strong> je uspešno primljena! 🎉
                  </p>
                  
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; margin: 25px 0; text-align: left;">
                    <h4 style="color: #fbbf24; margin-top: 0;">📋 Podaci o registraciji:</h4>
                    <p><strong>Ime i prezime:</strong> ${userData.first_name} ${
            userData.last_name
          }</p>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Telefon:</strong> ${userData.phone}</p>
                    <p><strong>Način plaćanja:</strong> ${
                      userData.payment_method === "paypal"
                        ? "PayPal"
                        : userData.payment_method === "wise"
                        ? "Wise"
                        : userData.payment_method === "bank"
                        ? "Banka"
                        : "Keš"
                    }</p>
                    <p><strong>Entry Fee:</strong>15 KM/ 8 EUR</p>
                  </div>
                  
                  <div style="background: rgba(34, 197, 94, 0.2); padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #22c55e;">
                    <h4 style="color: #22c55e; margin-top: 0;">🏆 NAGRADE 2025/26:</h4>
                    <p>🥇 <strong>1. mesto:</strong> 120 KM</p>
                    <p>🥈 <strong>2. mesto:</strong> 80 KM</p>
                    <p>🥉 <strong>3. mesto:</strong> 60 KM</p>
                  </div>
                  
                  <div style="background: rgba(239, 68, 68, 0.2); padding: 15px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong>⏳ Sledeći koraci:</strong><br>
                      Nakon verifikacije vaše uplate, dobićete email sa kodovima za pristup Champions League Fantasy ligi.
                      Molimo sačekajte potvrdu (obično u roku od 24h).
                    </p>
                  </div>
                  
                  <div style="margin-top: 30px;">
                    <p style="font-size: 14px; opacity: 0.9;">
                      Za pitanja kontaktirajte: <strong>muhamed.musa1994@gmail.com</strong>
                    </p>
                    <p style="font-size: 12px; opacity: 0.7; margin-top: 20px;">
                      REMIS Fantasyl<br>
                      Champions League Season 2025/26
                    </p>
                  </div>
                </div>
              </div>
            `,
        }),
      });

      if (!userEmailResponse.ok) {
        console.error("Failed to send user confirmation email");
      }

      // Send notification email to admin
      const adminEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "REMIS Fantasy <noreply@remisfantasy.com>",
          to: [ADMIN_EMAIL],
          subject: `🆕 Nova Champions League Registracija - ${userData.first_name} ${userData.last_name}`,
          html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 15px;">
                  <h1 style="margin: 0 0 20px 0;">🏆 Champions League - Nova Registracija</h1>
                  
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #fbbf24;">Podaci učesnika:</h3>
                    <p><strong>Ime:</strong> ${userData.first_name} ${userData.last_name}</p>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Telefon:</strong> ${userData.phone}</p>
                    <p><strong>Način plaćanja:</strong> ${userData.payment_method}</p>
                    <p><strong>Registracija ID:</strong> ${registrationId}</p>
                  </div>
                  
                  <p style="margin: 20px 0 0 0; font-size: 14px; opacity: 0.9;">
                    Proverite admin panel za verifikaciju uplate i slanje kodova.
                  </p>
                </div>
              </div>
            `,
        }),
      });

      if (!adminEmailResponse.ok) {
        console.error("Failed to send admin notification email");
      }

      // Update registration email sent status
      if (registrationId) {
        await supabase
          .from("cl_registrations_25_26")
          .update({
            registration_email_sent: true,
          })
          .eq("id", registrationId);
      }

      return NextResponse.json({
        success: true,
        message: "Champions League registration emails sent successfully",
      });
    }

    if (emailType === "champions_codes") {
      // Check if codes email was already sent
      const { data: existingRegistration } = await supabase
        .from("cl_registrations_25_26")
        .select("*")
        .eq("id", registrationId)
        .single();

      if (existingRegistration?.codes_email_sent) {
        return NextResponse.json({
          success: true,
          alreadySent: true,
          message: "Champions League codes email was already sent",
          registration: existingRegistration,
        });
      }

      // Send codes email to user
      const codesEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "REMIS Fantasy <noreply@remisfantasy.com>",
          to: [userData.email],
          subject:
            "🔑 Champions League Fantasy - Kodovi za pristup | REMIS Fantasy 2025/26",
          html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%); color: white; border-radius: 20px; overflow: hidden;">
                <div style="padding: 40px 30px; text-align: center;">
                  <div style="background: white; color: #1e3a8a; padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🏆 CHAMPIONS LEAGUE FANTASY 🏆</h1>
                    <h2 style="margin: 10px 0 0 0; color: #7c3aed; font-size: 18px;">Kodovi za pristup - Season 2025/26</h2>
                  </div>
                  
                  <h3 style="color: #22c55e; margin: 0 0 20px 0; font-size: 20px;">✅ Vaša uplata je verifikovana!</h3>
                  
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                    Dobrodošli u <strong>Champions League Fantasy 2025/26</strong>! 🎉<br>
                    Evo kodova za pristup ligi:
                  </p>
                  
                  <div style="background: rgba(255, 255, 255, 0.15); padding: 25px; border-radius: 15px; margin: 30px 0; border: 2px solid #fbbf24;">
                    <h4 style="color: #fbbf24; margin-top: 0; font-size: 18px;">🔑 KODOVI ZA LIGU:</h4>
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin: 15px 0;">
                      <p style="margin: 5px 0; font-family: monospace; font-size: 16px;">
                        <strong>Liga ID:</strong> <span style="color: #22c55e;">tbh7vp</span>
                      </p>
                    </div>
                  </div>
                  
                  <div style="background: rgba(34, 197, 94, 0.2); padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #22c55e; text-align: left;">
                    <h4 style="color: #22c55e; margin-top: 0;">📱 Kako da se priključite:</h4>
                    <p style="margin: 5px 0;">1. Idite na <strong>fantasy.premierleague.com</strong></p>
                    <p style="margin: 5px 0;">2. Napravite vaš tim (ako već nemate)</p>
                    <p style="margin: 5px 0;">3. Idite na <strong>"Leagues & Cups"</strong></p>
                    <p style="margin: 5px 0;">4. Kliknite <strong>"Join private league"</strong></p>
                    <p style="margin: 5px 0;">5. Unesite kod: <strong style="color: #fbbf24;">tbh7vp</strong></p>
                    <p style="margin: 5px 0;">6. Potvrdite pristup ligi! 🚀</p>
                  </div>
                  
                  <div style="background: rgba(239, 68, 68, 0.2); padding: 15px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong>⚠️ VAŽNO:</strong><br>
                      Molimo priključite se ligi što pre. Sezona počinje uskoro i ne želite da propustite bodove!
                    </p>
                  </div>
                  
                  <div style="background: rgba(34, 197, 94, 0.2); padding: 20px; border-radius: 10px; margin: 25px 0;">
                    <h4 style="color: #22c55e; margin-top: 0;">🏆 PODSETNIK NAGRADA:</h4>
                    <p>🥇 <strong>1. mesto:</strong> 120 KM</p>
                    <p>🥈 <strong>2. mesto:</strong> 80 KM</p>
                    <p>🥉 <strong>3. mesto:</strong> 60 KM</p>
                  </div>
                  
                  <div style="margin-top: 30px;">
                    <p style="font-size: 14px; opacity: 0.9;">
                      Za pitanja ili pomoć kontaktirajte: <strong>muhamed.musa1994@gmail.com</strong>
                    </p>
                    <p style="font-size: 12px; opacity: 0.7; margin-top: 20px;">
                      REMIS Fantasy - Champions League Season 2025/26<br>
                      Srećno u novoj sezoni! 🍀
                    </p>
                  </div>
                </div>
              </div>
            `,
        }),
      });

      if (!codesEmailResponse.ok) {
        throw new Error("Failed to send Champions League codes email");
      }

      // Update the registration with codes sent info
      const { data: updatedRegistration } = await supabase
        .from("cl_registrations_25_26")
        .update({
          codes_email_sent: true,
          codes_email_sent_at: new Date().toISOString(),
        })
        .eq("id", registrationId)
        .select()
        .single();

      return NextResponse.json({
        success: true,
        message: "Champions League codes email sent successfully",
        registration: updatedRegistration,
      });
    }

    return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
  } catch (error: any) {
    console.error("Champions League email sending error:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
