import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import { incrementUserUsage, getRemainingQuestions } from "@/lib/user-rate-limit";

export async function POST() {
  try {
    console.log('🧪 TEST SUPABASE - Starting test');
    
    // Test 1: Check session
    const session = await getServerSession(authOptions);
    console.log('🧪 Session test:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });

    if (!session?.user?.id) {
      return NextResponse.json({
        error: "Authentication required for test",
        step: "session_check"
      }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Test 2: Check Supabase connection
    console.log('🧪 Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabaseServer
      .from('users')
      .select('id')
      .limit(1);
      
    console.log('🧪 Connection test result:', {
      success: !connectionError,
      error: connectionError,
      dataCount: connectionTest?.length || 0
    });

    if (connectionError) {
      return NextResponse.json({
        error: "Supabase connection failed",
        details: connectionError,
        step: "connection_test"
      }, { status: 500 });
    }

    // Test 3: Check current usage before increment
    console.log('🧪 Checking current usage...');
    const usageBefore = await getRemainingQuestions(userId);
    console.log('🧪 Usage before:', usageBefore);

    // Test 4: Check if user exists in user_ai_usage table
    console.log('🧪 Checking user_ai_usage table...');
    const { data: currentUsage, error: usageError } = await supabaseServer
      .from('user_ai_usage')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .limit(5);

    console.log('🧪 Current usage records:', {
      error: usageError,
      recordCount: currentUsage?.length || 0,
      records: currentUsage
    });

    // Test 5: Try manual insert/upsert
    console.log('🧪 Testing manual upsert...');
    const testData = {
      user_id: userId,
      queries_used: 999, // Test value
      queries_limit: 3,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: upsertResult, error: upsertError } = await supabaseServer
      .from('user_ai_usage')
      .upsert(testData, {
        onConflict: 'user_id,period_start',
        ignoreDuplicates: false
      })
      .select('*');

    console.log('🧪 Manual upsert result:', {
      success: !upsertError,
      error: upsertError,
      data: upsertResult
    });

    if (upsertError) {
      return NextResponse.json({
        error: "Manual upsert failed",
        details: upsertError,
        step: "manual_upsert",
        testData
      }, { status: 500 });
    }

    // Test 6: Try the actual incrementUserUsage function
    console.log('🧪 Testing incrementUserUsage function...');
    await incrementUserUsage(userId);
    
    // Test 7: Check usage after increment
    console.log('🧪 Checking usage after increment...');
    const usageAfter = await getRemainingQuestions(userId);
    console.log('🧪 Usage after:', usageAfter);

    // Test 8: Get final state
    const { data: finalUsage, error: finalError } = await supabaseServer
      .from('user_ai_usage')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      tests: {
        session: {
          hasSession: !!session,
          userId: session.user.id,
          userEmail: session.user.email
        },
        connection: {
          success: !connectionError,
          error: connectionError
        },
        usageBefore,
        usageAfter,
        currentUsageRecords: {
          error: usageError,
          count: currentUsage?.length || 0,
          records: currentUsage
        },
        manualUpsert: {
          success: !upsertError,
          error: upsertError,
          result: upsertResult
        },
        finalUsageRecords: {
          error: finalError,
          count: finalUsage?.length || 0,
          records: finalUsage
        }
      }
    });

  } catch (error) {
    console.error('🧪 TEST SUPABASE - Error:', error);
    return NextResponse.json({
      error: "Test failed with exception",
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    }, { status: 500 });
  }
}