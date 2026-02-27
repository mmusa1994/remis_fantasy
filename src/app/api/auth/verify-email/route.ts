import { NextRequest, NextResponse } from "next/server";
import { createEmailVerification, sendOTPEmail, verifyOTP } from "@/lib/email-verification";

export async function POST(req: NextRequest) {
  try {
    const { email, action, otp, name } = await req.json();

    if (!email || !action) {
      return NextResponse.json(
        { error: "Email and action are required" },
        { status: 400 }
      );
    }

    // Send OTP
    if (action === 'send') {
      const { otp: generatedOtp, success } = await createEmailVerification(email);
      
      if (!success) {
        return NextResponse.json(
          { error: "User already exists or verification failed" },
          { status: 400 }
        );
      }

      const emailSent = await sendOTPEmail(email, generatedOtp, name);
      
      if (!emailSent) {
        return NextResponse.json(
          { error: "Failed to send verification email" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Verification code sent to your email",
        success: true
      });
    }

    // Verify OTP
    if (action === 'verify') {
      if (!otp) {
        return NextResponse.json(
          { error: "OTP is required" },
          { status: 400 }
        );
      }

      const isValid = await verifyOTP(email, otp);
      
      return NextResponse.json({
        valid: isValid,
        message: isValid ? "OTP verified successfully" : "Invalid or expired OTP"
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}