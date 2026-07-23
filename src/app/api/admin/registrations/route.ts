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

// Season-to-table mapping for Premier League
const PL_TABLE_MAP: Record<string, string> = {
  "25_26": "registration_25_26",
  "26_27": "registration_premier_league_26_27",
};

function getPLTable(season: string | null): string {
  return PL_TABLE_MAP[season || "26_27"] || PL_TABLE_MAP["26_27"];
}

// 26/27 tabela nema codes_email_sent kolone — stanje slanja kodova vodi se
// kroz confirmation_email_sent. Prevedi update payload i vraćeni red da
// dashboard može koristiti ista polja za obje sezone.
function translatePLUpdates(
  tableName: string,
  updates: Record<string, unknown>
): Record<string, unknown> {
  if (tableName !== "registration_premier_league_26_27") return updates;
  const translated = { ...updates };
  if ("codes_email_sent" in translated) {
    translated.confirmation_email_sent = translated.codes_email_sent;
    delete translated.codes_email_sent;
  }
  return translated;
}

function mapPLRow(
  tableName: string,
  row: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!row || tableName !== "registration_premier_league_26_27") return row;
  return {
    ...row,
    codes_email_sent: row.confirmation_email_sent ?? false,
    codes_email_sent_at: row.confirmation_email_sent_at ?? null,
  };
}

// Update s tolerancijom na nepokrenutu migraciju: ako confirmation_* kolone
// još ne postoje (42703), ponovi update bez njih umjesto da cijeli save 500-a.
async function runRegistrationUpdate(
  tableName: string,
  id: string,
  updates: Record<string, unknown>
) {
  let result = await supabaseServer
    .from(tableName)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (
    result.error?.code === "42703" &&
    ("confirmation_email_sent" in updates ||
      "confirmation_email_sent_at" in updates)
  ) {
    console.error(
      "confirmation_email_sent columns missing — run db/sql/pl_26_27_email_reliability.sql"
    );
    const rest = { ...updates };
    delete rest.confirmation_email_sent;
    delete rest.confirmation_email_sent_at;
    if (Object.keys(rest).length === 0) {
      result = await supabaseServer
        .from(tableName)
        .select()
        .eq("id", id)
        .single();
    } else {
      result = await supabaseServer
        .from(tableName)
        .update(rest)
        .eq("id", id)
        .select()
        .single();
    }
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");
    const tableName = getPLTable(season);

    // Fetch registrations using server-side client
    const { data, error } = await supabaseServer
      .from(tableName)
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching registrations:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 26/27 tabela vodi slanje kodova kroz confirmation_email_sent — mapiraj
    // na codes_email_sent koje dashboard već koristi za badge/dugme/statistiku.
    const registrations =
      tableName === "registration_premier_league_26_27"
        ? (data || []).map((row: Record<string, unknown>) => ({
            ...row,
            codes_email_sent: row.confirmation_email_sent ?? false,
            codes_email_sent_at: row.confirmation_email_sent_at ?? null,
          }))
        : data || [];

    return NextResponse.json({ registrations });
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

    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");
    const tableName = getPLTable(season);

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
    const { data, error } = await runRegistrationUpdate(
      tableName,
      id,
      translatePLUpdates(tableName, filteredUpdates)
    );

    if (error) {
      console.error("Error updating registration:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Check if any row was actually updated
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ registration: mapPLRow(tableName, data) });
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

    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");
    const tableName = getPLTable(season);

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
    const { data, error } = await runRegistrationUpdate(
      tableName,
      id,
      translatePLUpdates(tableName, { [field]: value })
    );

    if (error) {
      console.error("Error updating registration field:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Check if any row was actually updated
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ registration: mapPLRow(tableName, data) });
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
    const season = searchParams.get("season");
    const tableName = getPLTable(season);

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
      .from(tableName)
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
