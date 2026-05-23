import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import CreateTournamentLanding from "@/components/predictor/CreateTournamentLanding";
import LoginRequiredScreen from "@/components/predictor/LoginRequiredScreen";

export const dynamic = "force-dynamic";

export default async function CreateTournamentPage() {
  const session = await getServerSession(authOptions);
  const user = (session?.user as any) || null;

  if (!user?.id) {
    // Show a sophisticated login-required screen instead of redirecting.
    // The user sees the same visual language as the rest of the create flow,
    // explaining why they need an account and offering both sign-in and signup.
    return <LoginRequiredScreen />;
  }

  const { data: profile } = await supabaseServer
    .from("users")
    .select("name, tournament_create_credits")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <CreateTournamentLanding
      userEmail={user.email || ""}
      userName={profile?.name || user.name || ""}
      credits={profile?.tournament_create_credits ?? 0}
    />
  );
}
