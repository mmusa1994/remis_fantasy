import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { supabaseServer } from '@/lib/supabase-server';

// GET manager ID for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data, error } = await supabaseServer
      .from('users')
      .select('manager_id')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching manager ID:', error);
      return NextResponse.json({ error: 'Failed to fetch manager ID' }, { status: 500 });
    }

    return NextResponse.json({ managerId: data?.manager_id });
  } catch (error) {
    console.error('Manager ID GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST/PUT manager ID for current user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { managerId } = await req.json();
    
    // Validate manager ID (should be numeric string)
    if (!managerId || !/^\d{1,10}$/.test(managerId)) {
      return NextResponse.json({ 
        error: 'Invalid manager ID format. Must be 1-10 digits.' 
      }, { status: 400 });
    }

    // Test if manager ID exists by trying to fetch team data
    try {
      const testRes = await fetch(`https://fantasy.premierleague.com/api/entry/${managerId}/`);
      if (!testRes.ok) {
        return NextResponse.json({ 
          error: 'Manager ID not found in FPL database' 
        }, { status: 400 });
      }
    } catch (fetchError) {
      return NextResponse.json({ 
        error: 'Failed to validate manager ID with FPL API' 
      }, { status: 400 });
    }

    // Save manager ID to user record
    const { error } = await supabaseServer
      .from('users')
      .update({ 
        manager_id: managerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    if (error) {
      console.error('Error saving manager ID:', error);
      return NextResponse.json({ error: 'Failed to save manager ID' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Manager ID saved successfully',
      managerId 
    });
  } catch (error) {
    console.error('Manager ID POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}