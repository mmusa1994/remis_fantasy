import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tables = [
      'fpl_settings',
      'fpl_players', 
      'fpl_teams',
      'fpl_element_types',
      'fpl_fixtures',
      'fpl_fixture_stats',
      'fpl_live_players',
      'fpl_events_stream',
      'fpl_manager_metrics',
      'fpl_manager_picks',
      'fpl_gameweek_status'
    ];

    const results = [];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        results.push({
          table,
          exists: !error,
          error: error?.message || null,
          hasData: data && data.length > 0
        });
      } catch (err) {
        results.push({
          table,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          hasData: false
        });
      }
    }

    const existingTables = results.filter(r => r.exists).length;
    const missingTables = results.filter(r => !r.exists);

    return NextResponse.json({
      success: true,
      database_status: {
        total_tables: tables.length,
        existing_tables: existingTables,
        missing_tables: missingTables.length,
        tables: results,
        missing_table_names: missingTables.map(t => t.table)
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}