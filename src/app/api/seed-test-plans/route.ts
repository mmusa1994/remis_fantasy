import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
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

    console.log('Seeding subscription plans...');

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
        { error: "Failed to seed plans", details: error.message },
        { status: 500 }
      );
    }

    console.log('Plans seeded successfully:', data);

    return NextResponse.json({ 
      message: "Test plans seeded successfully",
      plans: data 
    });

  } catch (error: any) {
    console.error("Seed test plans API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}