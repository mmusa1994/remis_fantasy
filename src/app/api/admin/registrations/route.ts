import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import { z } from "zod";

// Zod schemas for request validation
const updateFieldSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  team_name: z.string().max(100).optional(),
  league_type: z.enum(["standard", "premium"]).optional(),
  h2h_league: z.boolean().optional(),
  admin_notes: z.string().max(1000).optional(),
  league_entry_status: z.enum(["pending", "approved", "rejected"]).optional(),
  registration_email_sent: z.boolean().optional(),
  codes_email_sent: z.boolean().optional(),
  email_template_type: z.string().max(50).optional(),
});

const putRequestSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  updates: updateFieldSchema,
});

const patchRequestSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)),
  field: z.string(),
  value: z.any(),
});

const deleteRequestSchema = z.object({
  id: z.string().min(1),
  reason: z.string().optional(),
});

// Define allowed updatable fields and their validation rules
const ALLOWED_UPDATE_FIELDS = {
  first_name: { type: "string", maxLength: 100, required: false },
  last_name: { type: "string", maxLength: 100, required: false },
  email: { type: "string", maxLength: 255, required: false },
  phone: { type: "string", maxLength: 20, required: false },
  team_name: { type: "string", maxLength: 100, required: false },
  league_type: {
    type: "string",
    enum: ["standard", "premium"],
    required: false,
  },
  h2h_league: { type: "boolean", required: false },
  admin_notes: { type: "string", maxLength: 1000, required: false },
  league_entry_status: {
    type: "string",
    enum: ["pending", "approved", "rejected"],
    required: false,
  },
  registration_email_sent: { type: "boolean", required: false },
  codes_email_sent: { type: "boolean", required: false },
  email_template_type: { type: "string", maxLength: 50, required: false },
};

// Protected fields that should never be updated
const PROTECTED_FIELDS = [
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "registration_email_sent_at",
  "codes_email_sent_at",
];

function validateField(
  fieldName: string,
  value: any,
  fieldConfig: any
): boolean {
  if (fieldConfig.type === "string") {
    if (typeof value !== "string") return false;
    if (fieldConfig.maxLength && value.length > fieldConfig.maxLength)
      return false;
    if (fieldConfig.enum && !fieldConfig.enum.includes(value)) return false;
  } else if (fieldConfig.type === "boolean") {
    if (typeof value !== "boolean") return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch registrations using server-side client
    const { data, error } = await supabaseServer
      .from("registration_25_26")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching registrations:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ registrations: data || [] });
  } catch (error) {
    console.error("Error in admin registrations API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const parseResult = putRequestSchema.safeParse(await request.json());

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { id, updates } = parseResult.data;

    // Filter and validate updates
    const filteredUpdates: any = {};

    for (const [field, value] of Object.entries(updates)) {
      // Reject protected fields
      if (PROTECTED_FIELDS.includes(field)) {
        return NextResponse.json(
          { error: `Cannot update protected field: ${field}` },
          { status: 400 }
        );
      }

      // Check if field is allowed
      const fieldConfig =
        ALLOWED_UPDATE_FIELDS[field as keyof typeof ALLOWED_UPDATE_FIELDS];
      if (!fieldConfig) {
        return NextResponse.json(
          { error: `Unknown field: ${field}` },
          { status: 400 }
        );
      }

      // Validate field value
      if (!validateField(field, value, fieldConfig)) {
        return NextResponse.json(
          { error: `Invalid value for field: ${field}` },
          { status: 400 }
        );
      }

      filteredUpdates[field] = value;
    }

    // Check if any valid updates remain
    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update registration using server-side client
    const { data, error } = await supabaseServer
      .from("registration_25_26")
      .update(filteredUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating registration:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Check if any row was actually updated
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ registration: data });
  } catch (error) {
    console.error("Error in admin registration update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const parseResult = patchRequestSchema.safeParse(await request.json());

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { id, field, value } = parseResult.data;

    // Validate field name
    if (PROTECTED_FIELDS.includes(field)) {
      return NextResponse.json(
        { error: `Cannot update protected field: ${field}` },
        { status: 400 }
      );
    }

    const fieldConfig =
      ALLOWED_UPDATE_FIELDS[field as keyof typeof ALLOWED_UPDATE_FIELDS];
    if (!fieldConfig) {
      return NextResponse.json(
        { error: `Unknown field: ${field}` },
        { status: 400 }
      );
    }

    // Validate field value
    if (!validateField(field, value, fieldConfig)) {
      return NextResponse.json(
        { error: `Invalid value for field: ${field}` },
        { status: 400 }
      );
    }

    // Update specific field using server-side client
    const { data, error } = await supabaseServer
      .from("registration_25_26")
      .update({ [field]: value })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating registration field:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Check if any row was actually updated
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ registration: data });
  } catch (error) {
    console.error("Error in admin registration field update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const reason = searchParams.get("reason");

    // Validate search parameters
    const parseResult = deleteRequestSchema.safeParse({ id, reason });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { id: validatedId, reason: validatedReason } = parseResult.data;

    // Extract deletion context
    const deletionReason = validatedReason || "Admin deletion";
    const deletedBy = (session as any)?.user?.email || "unknown";

    // Soft delete registration using server-side client
    const { data, error } = await supabaseServer
      .from("registration_25_26")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
        deletion_reason: deletionReason,
      })
      .eq("id", validatedId)
      .select()
      .single();

    if (error) {
      console.error("Error deleting registration:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Check if any row was actually updated
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedRegistration: data });
  } catch (error) {
    console.error("Error in admin registration delete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
