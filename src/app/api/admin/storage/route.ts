import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json({ error: "Missing file path" }, { status: 400 });
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
