import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import { managerIdValidator } from "@/lib/manager-id-validator";
import { ValidationState, ErrorType } from "@/types/validation";

// GET manager ID for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseServer
      .from("users")
      .select("manager_id, manager_id_verified, manager_id_verification_note")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching manager ID:", error);
      return NextResponse.json(
        { error: "Failed to fetch manager ID" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      managerId: data?.manager_id,
      isVerified: data?.manager_id_verified,
      verificationNote: data?.manager_id_verification_note,
    });
  } catch (error) {
    console.error("Manager ID GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST/PUT manager ID for current user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { managerId, allowUnverified = false } = await req.json();

    // Validate manager ID format
    if (!managerId || !/^\d{1,10}$/.test(managerId)) {
      return NextResponse.json(
        {
          error: "Invalid manager ID format. Must be 1-10 digits.",
          errorType: ErrorType.INVALID_ID,
        },
        { status: 400 }
      );
    }

    // Use enhanced validation with retry logic
    const validationResult = await managerIdValidator.validateManagerId(
      managerId
    );

    console.log("Validation result:", validationResult);

    // Handle different validation states
    switch (validationResult.state) {
      case ValidationState.SUCCESS:
        // Full validation success
        break;

      case ValidationState.PARTIAL_SUCCESS:
        // Fallback validation - allow if user explicitly accepts unverified
        if (!allowUnverified) {
          return NextResponse.json(
            {
              error: validationResult.warningMessage,
              errorType: validationResult.errorType,
              canRetry: validationResult.canRetry,
              fallbackAvailable: validationResult.fallbackAvailable,
              requiresConfirmation: true,
            },
            { status: 202 }
          ); // Accepted but requires confirmation
        }
        break;

      case ValidationState.FAILED:
        // Validation failed completely
        const errorDetails = managerIdValidator.getErrorDetailsForType(
          validationResult.errorType || ErrorType.UNKNOWN,
          managerId,
          validationResult.retryCount
        );

        return NextResponse.json(
          {
            error: errorDetails.userMessage,
            errorType: validationResult.errorType,
            canRetry: errorDetails.canRetry,
            fallbackAvailable: errorDetails.fallbackAvailable,
          },
          { status: 400 }
        );
    }

    // Save manager ID to user record
    const updateData: any = {
      manager_id: managerId,
      updated_at: new Date().toISOString(),
    };

    // Mark as unverified if it's a partial success
    if (validationResult.state === ValidationState.PARTIAL_SUCCESS) {
      updateData.manager_id_verified = false;
      updateData.manager_id_verification_note = validationResult.warningMessage;
    } else {
      updateData.manager_id_verified = true;
      updateData.manager_id_verification_note = null;
    }

    const { error } = await supabaseServer
      .from("users")
      .update(updateData)
      .eq("id", session.user.id);

    if (error) {
      console.error("Error saving manager ID:", error);
      return NextResponse.json(
        { error: "Failed to save manager ID" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        validationResult.state === ValidationState.SUCCESS
          ? "Manager ID verified and saved successfully"
          : "Manager ID saved (unverified)",
      managerId,
      isVerified: validationResult.isVerified,
      warningMessage: validationResult.warningMessage,
    });
  } catch (error) {
    console.error("Manager ID POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
