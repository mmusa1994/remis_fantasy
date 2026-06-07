import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import MyTournamentsClient from "@/components/predictor/MyTournamentsClient";

export const dynamic = "force-dynamic";

export default async function MyTournaments() {
  const session = await getServerSession(authOptions);
  const user = (session?.user as any) || null;
  if (!user?.id) redirect("/login?callbackUrl=/predictor/my-tournaments");

  const [{ data: tournaments }, { data: profile }] = await Promise.all([
    supabaseServer
      .from("predictor_tournaments")
      .select(
        "id, slug, name, short_description, status, visibility, accent_color, created_at, prize_pool_amount, prize_pool_currency, logo_url, created_via",
      )
      .eq("owner_user_id", user.id)
      // Only self-service tournaments belong in a user's personal collection.
      // Ones created through the /admin panel (created_via "admin" /
      // "admin_for_user") live in /admin only, even if owner_user_id is set.
      .in("created_via", ["user_credit", "user_paid"])
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabaseServer
      .from("users")
      .select("tournament_create_credits")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return (
    <MyTournamentsClient
      tournaments={tournaments || []}
      credits={profile?.tournament_create_credits ?? 0}
    />
  );
}
