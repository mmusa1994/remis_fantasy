import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user profile with subscription info
    const { data: user, error } = await supabaseServer
      .from('users')
      .select(`
        *,
        subscriptions!subscriptions_user_id_fkey (
          id,
          status,
          plan_id,
          subscription_plans (
            name,
            price_eur,
            ai_queries_limit
          )
        )
      `)
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    // Format the response
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      provider: user.provider,
      email_verified: user.email_verified,
      created_at: user.created_at,
      subscription: user.subscriptions?.[0] ? {
        plan: user.subscriptions[0].subscription_plans,
        status: user.subscriptions[0].status,
      } : null,
    };

    return NextResponse.json(profile);

  } catch (error: any) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { name, avatar_url } = await req.json();

    // Validate input
    if (name && (!name.trim() || name.trim().length < 1)) {
      return NextResponse.json(
        { error: "Name must be at least 1 character long" },
        { status: 400 }
      );
    }

    // Update user profile
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabaseServer
      .from('users')
      .update(updateData)
      .eq('id', session.user.id)
      .select(`
        *,
        subscriptions!subscriptions_user_id_fkey (
          id,
          status,
          plan_id,
          subscription_plans (
            name,
            price_eur,
            ai_queries_limit
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    // Format the response
    const profile = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar_url: updatedUser.avatar_url,
      provider: updatedUser.provider,
      email_verified: updatedUser.email_verified,
      created_at: updatedUser.created_at,
      subscription: updatedUser.subscriptions?.[0] ? {
        plan: updatedUser.subscriptions[0].subscription_plans,
        status: updatedUser.subscriptions[0].status,
      } : null,
    };

    return NextResponse.json(profile);

  } catch (error: any) {
    console.error("Profile update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}