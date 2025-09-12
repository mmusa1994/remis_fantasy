import { supabaseServer } from './supabase-server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-config";

interface UserUsage {
  queries_used: number;
  queries_limit: number;
  period_start: string;
  period_end: string;
}

interface SubscriptionPlan {
  ai_queries_limit: number;
}

interface Subscription {
  id: string;
  status: string;
  subscription_plans: SubscriptionPlan[];
}

interface UserWithSubscriptions {
  subscriptions: Subscription[];
}

export async function getUserFromRequest(req: Request): Promise<string | null> {
  try {
    // Try to get session from NextAuth
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      // For authenticated users, use the actual user ID from our database
      // Check if it's a valid UUID, if not, look up the user by email or provider ID
      if (isValidUUID(session.user.id)) {
        return session.user.id;
      } else {
        // This might be a Google ID or other provider ID, look up the actual user UUID
        const { data: user } = await supabaseServer
          .from('users')
          .select('id')
          .eq('email', session.user.email!)
          .single();
        
        return user?.id || null;
      }
    }

    // Fallback to IP-based identification for non-authenticated users
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const remoteAddr = req.headers.get("remote-addr");

    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : realIp
      ? realIp.trim()
      : remoteAddr
      ? remoteAddr.trim()
      : "localhost";

    if (
      ip === "localhost" ||
      ip === "unknown" ||
      ip === "::1" ||
      ip === "127.0.0.1"
    ) {
      const userAgent = req.headers.get("user-agent") || "unknown";
      const sessionId =
        userAgent.slice(0, 20) + "_" + Date.now().toString().slice(-6);
      return `guest_${sessionId}`;
    }

    return `guest_${ip}`;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart;
}

export function getWeekEnd(): Date {
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

async function getUserUsageFromDB(userId: string): Promise<UserUsage | null> {
  try {
    const { data, error } = await supabaseServer
      .from('user_ai_usage')
      .select('queries_used, queries_limit, period_start, period_end')
      .eq('user_id', userId)
      .gte('period_end', new Date().toISOString())
      .order('period_start', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user usage:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getUserUsageFromDB:', error);
    return null;
  }
}

async function getUserSubscriptionLimits(userId: string): Promise<number> {
  try {
    // First check if it's a guest user (starts with guest_)
    if (userId.startsWith('guest_')) {
      return 3; // Default limit for guest users
    }

    const { data, error } = await supabaseServer
      .from('users')
      .select(`
        subscriptions!subscriptions_user_id_fkey (
          id,
          status,
          subscription_plans (
            ai_queries_limit
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !data) {
      return 3; // Default limit if user not found
    }

    const userData = data as UserWithSubscriptions;
    const activeSubscription = userData.subscriptions?.find(
      (sub: Subscription) => sub.status === 'active'
    );

    if (activeSubscription?.subscription_plans?.[0]?.ai_queries_limit) {
      return activeSubscription.subscription_plans[0].ai_queries_limit;
    }

    return 3; // Default free tier limit
  } catch (error) {
    console.error('Error getting subscription limits:', error);
    return 3;
  }
}

async function createOrUpdateUserUsage(
  userId: string, 
  queries_used: number, 
  queries_limit: number
): Promise<void> {
  console.log('🔧 createOrUpdateUserUsage called:', {
    userId,
    queries_used,
    queries_limit
  });
  try {
    const currentPeriodStart = getWeekStart();
    const currentPeriodEnd = getWeekEnd();

    const updateData = {
      user_id: userId,
      queries_used,
      queries_limit,
      period_start: currentPeriodStart.toISOString(),
      period_end: currentPeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 About to upsert data:', updateData);

    // Try update first, then insert if no rows affected
    const { data: updateResult, error: updateError } = await supabaseServer
      .from('user_ai_usage')
      .update({
        queries_used,
        queries_limit,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .gte('period_end', new Date().toISOString())
      .select('*');

    if (updateError) {
      console.log('⚠️ Update failed, trying insert:', updateError.message);
      
      // If update failed or no rows affected, try insert
      const { data: insertResult, error: insertError } = await supabaseServer
        .from('user_ai_usage')
        .insert(updateData)
        .select('*');

      if (insertError) {
        console.error('❌ Both update and insert failed');
        console.error('❌ Update error:', updateError);
        console.error('❌ Insert error:', insertError);
      } else {
        console.log('✅ Insert successful:', insertResult);
      }
    } else if (!updateResult || updateResult.length === 0) {
      console.log('⚠️ Update returned no rows, trying insert');
      
      const { data: insertResult, error: insertError } = await supabaseServer
        .from('user_ai_usage')
        .insert(updateData)
        .select('*');

      if (insertError) {
        console.error('❌ Insert after empty update failed:', insertError);
      } else {
        console.log('✅ Insert after empty update successful:', insertResult);
      }
    } else {
      console.log('✅ Update successful:', updateResult);
    }
  } catch (error) {
    console.error('❌ Exception in createOrUpdateUserUsage:', error);
    console.error('❌ Exception details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

export async function checkUserRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetDate: Date;
  total: number;
}> {
  try {
    const userUsage = await getUserUsageFromDB(userId);
    const subscriptionLimit = await getUserSubscriptionLimits(userId);
    
    const currentPeriodStart = getWeekStart();
    const resetDate = getWeekEnd();

    // If no usage record exists or period has expired, create new one
    if (!userUsage || new Date(userUsage.period_start) < currentPeriodStart) {
      await createOrUpdateUserUsage(userId, 0, subscriptionLimit);
      return { 
        allowed: true, 
        remaining: subscriptionLimit, 
        resetDate,
        total: subscriptionLimit 
      };
    }

    // Check current usage against limits
    const remaining = Math.max(0, userUsage.queries_limit - userUsage.queries_used);
    const allowed = userUsage.queries_used < userUsage.queries_limit;

    return {
      allowed,
      remaining,
      resetDate: new Date(userUsage.period_end),
      total: userUsage.queries_limit
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { allowed: false, remaining: 0, resetDate: new Date(), total: 0 };
  }
}

export async function incrementUserUsage(userId: string): Promise<void> {
  console.log('🔄 incrementUserUsage called for userId:', userId);
  try {
    const userUsage = await getUserUsageFromDB(userId);
    const subscriptionLimit = await getUserSubscriptionLimits(userId);
    
    console.log('📊 Current usage data:', {
      userId,
      currentUsage: userUsage?.queries_used || 0,
      limit: userUsage?.queries_limit || subscriptionLimit,
      subscriptionLimit,
      hasExistingUsage: !!userUsage
    });
    
    const currentPeriodStart = getWeekStart();

    if (!userUsage || new Date(userUsage.period_start) < currentPeriodStart) {
      // Create new usage period with 1 query used
      console.log('✨ Creating NEW usage period with 1 query');
      await createOrUpdateUserUsage(userId, 1, subscriptionLimit);
      console.log('✅ NEW usage period created');
    } else {
      // Increment existing usage
      const newCount = userUsage.queries_used + 1;
      console.log('⬆️ Incrementing existing usage:', {
        oldCount: userUsage.queries_used,
        newCount,
        limit: userUsage.queries_limit
      });
      await createOrUpdateUserUsage(userId, newCount, userUsage.queries_limit);
      console.log('✅ Usage incremented successfully');
    }
    console.log('🎉 incrementUserUsage completed successfully');
  } catch (error) {
    console.error('❌ Error incrementing usage:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
  }
}

export async function getRemainingQuestions(userId: string): Promise<{
  remaining: number;
  total: number;
  resetDate: Date;
}> {
  const { remaining, resetDate, total } = await checkUserRateLimit(userId);
  return { remaining, resetDate, total };
}

export async function resetUserUsage(userId: string): Promise<void> {
  try {
    const { error } = await supabaseServer
      .from('user_ai_usage')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting user usage:', error);
    }
  } catch (error) {
    console.error('Error in resetUserUsage:', error);
  }
}

// Admin function to reset all usage (for testing/maintenance)
export async function resetAllUsage(): Promise<void> {
  try {
    const { error } = await supabaseServer
      .from('user_ai_usage')
      .delete()
      .neq('user_id', '');

    if (error) {
      console.error('Error resetting all usage:', error);
    }
  } catch (error) {
    console.error('Error in resetAllUsage:', error);
  }
}