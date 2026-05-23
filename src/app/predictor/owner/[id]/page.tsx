import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import OwnerTournamentEditor from "@/components/predictor/OwnerTournamentEditor";

export const dynamic = "force-dynamic";

export default async function OwnerEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const user = (session?.user as any) || null;
  if (!user?.id) redirect(`/login?callbackUrl=/predictor/owner/${id}`);

  const { data: tournament } = await supabaseServer
    .from("predictor_tournaments")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!tournament) notFound();
  if (tournament.owner_user_id !== user.id) {
    redirect("/predictor/my-tournaments");
  }

  return <OwnerTournamentEditor initialTournament={tournament} />;
}
