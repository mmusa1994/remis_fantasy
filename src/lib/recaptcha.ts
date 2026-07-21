const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

// Server-side reCAPTCHA verification. Returns false (blocking the request)
// when the secret is not configured — fail closed, matching /api/send-email.
export async function verifyRecaptcha(token: unknown): Promise<boolean> {
  if (!recaptchaSecretKey) {
    console.error("Missing env var RECAPTCHA_SECRET_KEY");
    return false;
  }
  if (!token || typeof token !== "string") return false;

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: recaptchaSecretKey, response: token }),
      }
    );
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("reCAPTCHA verification failed:", error);
    return false;
  }
}
