import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireTournamentOwner, jsonError } from "@/lib/predictor";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const BUCKET = "predictor-tournament-images";

/**
 * Owner image upload endpoint — used by the Settings tab when an owner picks
 * a banner / hero / logo file. Stored under a per-tournament folder so each
 * owner can only overwrite their own assets via signed paths.
 *
 * Request: multipart/form-data with fields:
 *   file:           the image File
 *   tournament_id:  UUID of the tournament being branded
 *   kind:           "banner" | "hero" | "logo" — used as filename prefix
 *
 * Response: { url: string, path: string }
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tournamentId = String(formData.get("tournament_id") || "");
  const kind = String(formData.get("kind") || "logo");

  if (!file) return jsonError("file required", 400);
  if (!tournamentId) return jsonError("tournament_id required", 400);
  if (!["banner", "hero", "logo"].includes(kind))
    return jsonError("kind must be banner|hero|logo", 400);

  const own = await requireTournamentOwner(tournamentId);
  if (!own.ok) return own.response;

  if (!ALLOWED.includes(file.type)) {
    return jsonError("Unsupported type. Use JPEG, PNG, WebP, GIF, or SVG.", 400);
  }
  if (file.size > MAX_SIZE) {
    return jsonError("Max file size is 8 MB.", 400);
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 6);
  const path = `${tournamentId}/${kind}-${Date.now().toString(36)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Auto-create the bucket if it doesn't exist
  const { data: buckets } = await supabaseServer.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error: createErr } = await supabaseServer.storage.createBucket(
      BUCKET,
      { public: true, fileSizeLimit: MAX_SIZE },
    );
    if (createErr && !/already exists/i.test(createErr.message)) {
      console.error("[predictor upload-image] bucket create failed:", createErr.message);
      return jsonError(`Could not create storage bucket: ${createErr.message}`, 500);
    }
  }

  const { data, error } = await supabaseServer.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "31536000",
    });

  if (error) {
    console.error("[predictor upload-image]", error.message);
    return jsonError(error.message, 500);
  }

  const { data: urlData } = supabaseServer.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return NextResponse.json({ url: urlData.publicUrl, path: data.path });
}
