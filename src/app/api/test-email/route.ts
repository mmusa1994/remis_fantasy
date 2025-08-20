import { NextResponse } from "next/server";
import * as nodemailer from "nodemailer";

// Validate required environment variables
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

if (!emailUser) {
  throw new Error("Missing env var EMAIL_USER");
}

if (!emailPass) {
  throw new Error("Missing env var EMAIL_PASS");
}

export async function POST() {
  try {
    // Test transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Verify connection
    await transporter.verify();

    // Send test email
    const testEmail = {
      from: emailUser,
      to: emailUser, // Send to yourself for testing
      subject: "REMIS Fantasy - Email Test",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">✅ Email Configuration Test</h2>
          <p>If you received this email, your email configuration is working correctly!</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>From:</strong> ${emailUser}</p>
        </div>
      `,
    };

    const result = await transporter.sendMail(testEmail);

    return NextResponse.json(
      {
        success: true,
        message: "Test email sent successfully",
        messageId: result.messageId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email Test Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
