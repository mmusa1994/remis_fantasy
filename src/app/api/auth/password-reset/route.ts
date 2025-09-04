import { NextRequest, NextResponse } from "next/server";
import { createPasswordReset, resetPasswordWithOTP, sendPasswordResetEmail } from "@/lib/password-reset";

export async function POST(req: NextRequest) {
  try {
    const { email, action, otp, newPassword } = await req.json();

    if (!email || !action) {
      return NextResponse.json(
        { error: "Email and action are required" },
        { status: 400 }
      );
    }

    if (action === "request") {
      const result = await createPasswordReset(email);

      // Always respond generically to avoid leaking account existence
      if (!result.success) {
        return NextResponse.json({ message: "If an account exists, a reset code has been sent." });
      }

      const sent = await sendPasswordResetEmail(email, result.otp!, result.userName);
      if (!sent) {
        return NextResponse.json(
          { error: "Failed to send reset email" },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Reset code sent to your email", success: true });
    }

    if (action === "reset") {
      if (!otp || !newPassword) {
        return NextResponse.json(
          { error: "OTP and newPassword are required" },
          { status: 400 }
        );
      }

      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const { success } = await resetPasswordWithOTP(email, otp, newPassword);
      if (!success) {
        return NextResponse.json(
          { error: "Invalid code or unable to reset password" },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: "Password updated successfully", success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

