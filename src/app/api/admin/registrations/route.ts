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
  // Nullable polja: dashboard "N/A"/"NULL" opcije šalju eksplicitni null
  // koji čisti vrijednost u bazi. league_type NIJE nullable —
  // registration_25_26.league_type je NOT NULL kolona, null bi save oborio
  // s 23502; null se zato tretira kao "nije poslano".
  league_type: z.enum(["standard", "premium"]).optional(),
  league_tier: z
    .enum(["standard", "premium", "h2h_only", "standard_h2h", "premium_h2h"])
    .nullable()
    .optional(),
  h2h_league: z.boolean().optional(),
  payment_method: z
    .enum(["stripe", "cash", "bank", "wise", "paypal"])
    .nullable()
    .optional(),
  payment_status: z.enum(["paid", "pending"]).nullable().optional(),
  cash_status: z.enum(["paid", "pending"]).nullable().optional(),
  admin_notes: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
  // Stvarne vrijednosti u bazi: entered / not_entered / pending (26/27
  // default). Dashboard šalje entered/not_entered, null čisti status.
  league_entry_status: z
    .enum(["entered", "not_entered", "pending"])
    .nullable()
    .optional(),
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
  league_tier: {
    type: "string",
    enum: ["standard", "premium", "h2h_only", "standard_h2h", "premium_h2h"],
    required: false,
    nullable: true,
  },
  h2h_league: { type: "boolean", required: false },
  payment_method: {
    type: "string",
    enum: ["stripe", "cash", "bank", "wise", "paypal"],
    required: false,
    nullable: true,
  },
  payment_status: {
    type: "string",
    enum: ["paid", "pending"],
    required: false,
    nullable: true,
  },
  cash_status: {
    type: "string",
    enum: ["paid", "pending"],
    required: false,
    nullable: true,
  },
  admin_notes: { type: "string", maxLength: 1000, required: false },
  notes: { type: "string", maxLength: 1000, required: false },
  league_entry_status: {
    type: "string",
    enum: ["entered", "not_entered", "pending"],
    required: false,
    // Dashboard "Nije postavljeno" šalje null da očisti status.
    nullable: true,
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
  if (value === null) {
    return fieldConfig.nullable === true;
  }
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

// Nepostojeća kolona u updateu: PostgREST vraća PGRST204 ("Could not find
// the 'x' column ... in the schema cache"), a Postgres 42703. Izvuci ime
// kolone iz poruke da se može ukloniti iz payloada.
function missingColumnFromError(error: {
  code?: string;
  message?: string;
} | null): string | null {
  if (!error || (error.code !== "PGRST204" && error.code !== "42703")) {
    return null;
  }
  const message = error.message || "";
  const match =
    message.match(/'([^']+)' column/) || message.match(/column "([^"]+)"/);
  return match ? match[1] : null;
}

// Update s tolerancijom na kolone koje u ovoj tabeli/sezoni ne postoje
// (npr. confirmation_* prije migracije, ili 25/26-only polja na 26/27
// tabeli): umjesto da cijeli save 500-a, ukloni prijavljenu kolonu i ponovi.
async function runRegistrationUpdate(
  tableName: string,
  id: string,
  updates: Record<string, unknown>
) {
  const remaining = { ...updates };

  let result = await supabaseServer
    .from(tableName)
    .update(remaining)
    .eq("id", id)
    .select()
    .single();

  for (let attempt = 0; attempt < 8; attempt++) {
    const missingColumn = missingColumnFromError(result.error);
    if (!missingColumn || !(missingColumn in remaining)) break;

    console.warn(
      `Column "${missingColumn}" missing on ${tableName} — retrying update without it`
    );
    delete remaining[missingColumn];

    if (Object.keys(remaining).length === 0) {
      result = await supabaseServer
        .from(tableName)
        .select()
        .eq("id", id)
        .single();
      break;
    }

    result = await supabaseServer
      .from(tableName)
      .update(remaining)
      .eq("id", id)
      .select()
      .single();
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

    // Parse and validate request body. Dashboard šalje editFormData polja
    // verbatim — null na nullable polju je eksplicitno čišćenje vrijednosti
    // i propušta se dalje; null na ostalim poljima (kolone koje za ovu
    // sezonu ne postoje ili su prazne) tretiraj kao "nije poslano", inače
    // z.string().optional() pada na null i cijeli save vraća 400.
    const rawBody = await request.json();
    if (rawBody?.updates && typeof rawBody.updates === "object") {
      for (const key of Object.keys(rawBody.updates)) {
        if (rawBody.updates[key] !== null) continue;
        const fieldConfig =
          ALLOWED_UPDATE_FIELDS[key as keyof typeof ALLOWED_UPDATE_FIELDS];
        if (!fieldConfig || !("nullable" in fieldConfig)) {
          delete rawBody.updates[key];
        }
      }
    }
    const parseResult = putRequestSchema.safeParse(rawBody);

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

    // Validate search parameters — searchParams.get vraća null kad parametra
    // nema, a z.string().optional() prihvata samo undefined.
    const parseResult = deleteRequestSchema.safeParse({
      id,
      reason: reason ?? undefined,
    });

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
    let { data, error } = await supabaseServer
      .from(tableName)
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
        deletion_reason: deletionReason,
      })
      .eq("id", validatedId)
      .select()
      .single();

    // Tabela bez deleted_by/deletion_reason kolona (npr. 26/27): soft-delete
    // samo preko deleted_at umjesto da brisanje padne s 500. (PostgREST za
    // nepostojeću kolonu u updateu vraća PGRST204, Postgres 42703.)
    if (error?.code === "42703" || error?.code === "PGRST204") {
      console.warn(
        `Soft-delete audit columns missing on ${tableName} — deleting with deleted_at only`
      );
      ({ data, error } = await supabaseServer
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", validatedId)
        .select()
        .single());
    }

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
