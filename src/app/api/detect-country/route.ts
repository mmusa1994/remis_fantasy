import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get IP address from headers
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Use a free IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();

    // Map countries to languages
    const countryToLanguage: Record<string, string> = {
      RS: "sr", // Serbia
      BA: "bs", // Bosnia and Herzegovina
      HR: "hr", // Croatia
      ME: "bs", // Montenegro (use Bosnian)
      MK: "bs", // North Macedonia (use Bosnian)
    };

    const detectedLanguage = countryToLanguage[data.countryCode] || "en";

    return NextResponse.json({
      success: true,
      data: {
        ip,
        country: data.country,
        countryCode: data.countryCode,
        language: detectedLanguage,
      },
    });
  } catch (error) {
    console.error("Error detecting country:", error);
    return NextResponse.json({
      success: false,
      language: "en", // fallback to English
      error: "Failed to detect country",
    });
  }
}
