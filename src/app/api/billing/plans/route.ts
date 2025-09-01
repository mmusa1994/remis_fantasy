import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: plans, error } = await supabaseServer
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_eur', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return NextResponse.json(
        { error: "Failed to fetch plans" },
        { status: 500 }
      );
    }

    // Get user's current subscription - use specific relationship
    const { data: userSubscription, error: subError } = await supabaseServer
      .from('users')
      .select(`
        subscriptions!subscriptions_user_id_fkey (
          id,
          status,
          plan_id,
          subscription_plans (
            id,
            name
          )
        )
      `)
      .eq('id', session.user.id)
      .single();

    if (subError) {
      console.error('Error fetching user subscription:', subError);
    }

    const currentPlanId = userSubscription?.subscriptions?.[0]?.plan_id;

    return NextResponse.json({
      plans,
      currentPlanId
    });

  } catch (error: any) {
    console.error("Billing plans API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}