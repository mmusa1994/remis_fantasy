import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { filePath } = body;

    // Comprehensive file path validation
    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Check for empty string
    if (filePath.trim() === "") {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Prevent path traversal attacks
    if (filePath.startsWith("/") || filePath.includes("..")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Validate safe key pattern: alphanumerics, dashes, underscores, slashes, dots
    const safeKeyPattern = /^[a-zA-Z0-9\-_\/.]+$/;
    if (!safeKeyPattern.test(filePath)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Get signed URL using server-side client (5 minutes expiry)
    const { data, error } = await supabaseServer.storage
      .from("payment-proofs")
      .createSignedUrl(filePath, 300);

    if (error) {
      console.error("Error getting signed URL:", error);
      return NextResponse.json({ error: "Storage error" }, { status: 500 });
    }

    // Validate that signed URL is present
    if (!data?.signedUrl) {
      console.error("Error: Signed URL is missing from response");
      return NextResponse.json({ error: "Storage error" }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error) {
    console.error("Error in admin storage API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
