import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin (you can adjust this check)
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const plans = [
      {
        name: 'Free',
        description: 'Perfect for getting started with basic features',
        price_eur: 0.00,
        ai_queries_limit: 3,
        billing_interval: 'weekly',
        is_active: true
      },
      {
        name: 'Basic',
        description: 'Great for casual fantasy managers',
        price_eur: 4.99,
        ai_queries_limit: 10,
        billing_interval: 'monthly',
        is_active: true
      },
      {
        name: 'Premium',
        description: 'Advanced features for serious fantasy managers',
        price_eur: 9.99,
        ai_queries_limit: 15,
        billing_interval: 'monthly',
        is_active: true
      },
      {
        name: 'Pro',
        description: 'Professional tools for dedicated managers',
        price_eur: 14.99,
        ai_queries_limit: 50,
        billing_interval: 'monthly',
        is_active: true
      }
    ];

    // Use upsert to handle conflicts
    const { data, error } = await supabaseServer
      .from('subscription_plans')
      .upsert(plans, { 
        onConflict: 'name',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error seeding plans:', error);
      return NextResponse.json(
        { error: "Failed to seed plans" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Plans seeded successfully",
      plans: data 
    });

  } catch (error: any) {
    console.error("Seed plans API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}