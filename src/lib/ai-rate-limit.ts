import { supabaseServer } from './supabase-server';

interface UserUsage {
  count: number;
  weekStart: number;
}

export function getUserId(req: Request): string {
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
    return `dev_${sessionId}`;
  }

  return `user_${ip}`;
}

export function getWeekStart(): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart.getTime();
}

async function getUserUsageFromDB(userId: string): Promise<UserUsage | null> {
  try {
    const { data, error } = await supabaseServer
      .from('ai_usage_limits')
      .select('count, week_start')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user usage:', error);
      return null;
    }

    if (!data) return null;

    return {
      count: data.count,
      weekStart: data.week_start,
    };
  } catch (error) {
    console.error('Error in getUserUsageFromDB:', error);
    return null;
  }
}

async function updateUserUsageInDB(userId: string, usage: UserUsage): Promise<void> {
  try {
    // First, clean up any duplicate records for this user
    const { data: existingRecords } = await supabaseServer
      .from('ai_usage_limits')
      .select('id')
      .eq('user_id', userId);

    if (existingRecords && existingRecords.length > 1) {
      // Keep only the first record, delete the rest
      const idsToDelete = existingRecords.slice(1).map(r => r.id);
      await supabaseServer
        .from('ai_usage_limits')
        .delete()
        .in('id', idsToDelete);
    }

    // Use upsert with explicit conflict resolution
    const { error } = await supabaseServer
      .from('ai_usage_limits')
      .upsert({
        user_id: userId,
        count: usage.count,
        week_start: usage.weekStart,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error updating user usage:', error);
    }
  } catch (error) {
    console.error('Error in updateUserUsageInDB:', error);
  }
}

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetDate: Date;
}> {
  const currentWeekStart = getWeekStart();
  const userUsage = await getUserUsageFromDB(userId);

  if (!userUsage || userUsage.weekStart < currentWeekStart) {
    const newUsage = {
      count: 0,
      weekStart: currentWeekStart,
    };
    
    await updateUserUsageInDB(userId, newUsage);

    const resetDate = new Date(currentWeekStart + 7 * 24 * 60 * 60 * 1000);
    return { allowed: true, remaining: 3, resetDate };
  }

  const remaining = Math.max(0, 3 - userUsage.count);
  const resetDate = new Date(userUsage.weekStart + 7 * 24 * 60 * 60 * 1000);
  const allowed = userUsage.count < 3;

  return {
    allowed,
    remaining,
    resetDate,
  };
}

export async function incrementUsage(userId: string): Promise<void> {
  const currentWeekStart = getWeekStart();
  const userUsage = await getUserUsageFromDB(userId);

  if (!userUsage || userUsage.weekStart < currentWeekStart) {
    await updateUserUsageInDB(userId, {
      count: 1,
      weekStart: currentWeekStart,
    });
  } else {
    const newCount = userUsage.count + 1;
    await updateUserUsageInDB(userId, {
      count: newCount,
      weekStart: userUsage.weekStart,
    });
  }
}

export async function getRemainingQuestions(userId: string): Promise<{
  remaining: number;
  resetDate: Date;
}> {
  const { remaining, resetDate } = await checkRateLimit(userId);
  return { remaining, resetDate };
}

export async function resetAllUsage(): Promise<void> {
  try {
    const { error } = await supabaseServer
      .from('ai_usage_limits')
      .delete()
      .neq('user_id', '');

    if (error) {
      console.error('Error resetting all usage:', error);
    }
  } catch (error) {
    console.error('Error in resetAllUsage:', error);
  }
}

export async function resetUserUsage(userId: string): Promise<void> {
  try {
    const { error } = await supabaseServer
      .from('ai_usage_limits')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting user usage:', error);
    }
  } catch (error) {
    console.error('Error in resetUserUsage:', error);
  }
}
