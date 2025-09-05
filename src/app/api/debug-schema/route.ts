import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    console.log('🔍 DEBUG SCHEMA - Starting schema debug');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({
        error: "Authentication required"
      }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Check table schema and constraints
    const { data: schemaInfo, error: schemaError } = await supabaseServer
      .rpc('get_table_info', { table_name: 'user_ai_usage' })
      .single();
    
    console.log('🔍 Table schema info:', { schemaInfo, schemaError });

    // Check table permissions by trying various operations
    const testOperations = [];
    
    // Test SELECT
    try {
      const { data: selectData, error: selectError } = await supabaseServer
        .from('user_ai_usage')
        .select('*')
        .eq('user_id', userId)
        .limit(1);
      
      testOperations.push({
        operation: 'SELECT',
        success: !selectError,
        error: selectError,
        rowCount: selectData?.length || 0
      });
    } catch (e) {
      testOperations.push({
        operation: 'SELECT',
        success: false,
        error: e
      });
    }

    // Test INSERT
    try {
      const testInsertData = {
        user_id: userId,
        queries_used: 0,
        queries_limit: 3,
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await supabaseServer
        .from('user_ai_usage')
        .insert(testInsertData)
        .select('*');
        
      testOperations.push({
        operation: 'INSERT',
        success: !insertError,
        error: insertError,
        data: insertData
      });
      
      // Clean up test insert if successful
      if (!insertError && insertData?.[0]) {
        await supabaseServer
          .from('user_ai_usage')
          .delete()
          .eq('id', insertData[0].id);
      }
      
    } catch (e) {
      testOperations.push({
        operation: 'INSERT',
        success: false,
        error: e
      });
    }

    // Test UPDATE
    try {
      // First ensure we have a record to update
      const { data: existingRecord } = await supabaseServer
        .from('user_ai_usage')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (existingRecord) {
        const { data: updateData, error: updateError } = await supabaseServer
          .from('user_ai_usage')
          .update({ queries_used: existingRecord.queries_used })
          .eq('user_id', userId)
          .eq('id', existingRecord.id)
          .select('*');
          
        testOperations.push({
          operation: 'UPDATE',
          success: !updateError,
          error: updateError,
          data: updateData
        });
      } else {
        testOperations.push({
          operation: 'UPDATE',
          success: false,
          error: 'No existing record to update'
        });
      }
      
    } catch (e) {
      testOperations.push({
        operation: 'UPDATE',
        success: false,
        error: e
      });
    }

    // Check current environment variables (without exposing sensitive data)
    const envCheck = {
      hasSupabaseUrl: !!process.env.SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlSource: process.env.SUPABASE_URL ? 'SUPABASE_URL' : 
                        process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : 'none',
      nodeEnv: process.env.NODE_ENV
    };

    // Get all user_ai_usage records for this user
    const { data: allUserRecords, error: allRecordsError } = await supabaseServer
      .from('user_ai_usage')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false });

    return NextResponse.json({
      userId,
      envCheck,
      schemaInfo: schemaInfo || schemaError,
      testOperations,
      allUserRecords: {
        error: allRecordsError,
        count: allUserRecords?.length || 0,
        records: allUserRecords
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 DEBUG SCHEMA - Error:', error);
    return NextResponse.json({
      error: "Schema debug failed",
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    }, { status: 500 });
  }
}