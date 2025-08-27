# FPL Live Database Setup Guide

## Quick Setup Steps

### 1. Run Database Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the **SQL Editor** tab

2. **Execute the Migration Script**
   - Copy the entire contents of `supabase-fpl-init.sql`
   - Paste it into the SQL editor
   - Click **"Run"** to execute

3. **Verify Tables Created**
   - You should see a success message
   - Navigate to the **Table Editor** to confirm all 11 FPL tables are created

### 2. Set Environment Variables

Add these to your `.env.local` file:

```env
# Required - Get from Supabase Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional - For proxy setup
FPL_PROXY_URL=https://your-proxy.com
FPL_CRON_SECRET=your_secret_here
```

### 3. Test the Setup

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Test database connection**
   - Visit: `http://localhost:3000/api/fpl/setup` (POST request)
   - Should return status of all 11 tables

3. **Access FPL Live**
   - Navigate to: `http://localhost:3000/premier-league/fpl-live`
   - You should see the dashboard without errors

## Tables Created

The migration creates these 11 tables:

- `fpl_settings` - App configuration
- `fpl_teams` - Premier League teams
- `fpl_element_types` - Player positions (GK, DEF, MID, FWD)
- `fpl_players` - All FPL players
- `fpl_fixtures` - Match fixtures and results
- `fpl_fixture_stats` - Detailed match statistics
- `fpl_live_players` - Live player stats per gameweek
- `fpl_events_stream` - Real-time events (goals, assists, cards)
- `fpl_manager_picks` - Manager team selections
- `fpl_manager_metrics` - Team performance summaries
- `fpl_gameweek_status` - Bonus finalization tracking

## Troubleshooting

### "Table does not exist" errors
- Ensure the migration script ran completely
- Check the Table Editor in Supabase dashboard
- Re-run the migration if needed

### Permission errors
- Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check RLS policies are created (they're in the migration script)

### API connection issues
- Test with: `http://localhost:3000/api/fpl/bootstrap`
- Verify environment variables are loaded
- Check browser Network tab for specific error details

## Next Steps

After setup is complete, you can:

1. **Load a team** - Enter Manager ID 133790 and current gameweek
2. **Bootstrap data** - First load will populate teams/players from FPL API
3. **Test live features** - Use "Fetch Now" to get current data
4. **Enable polling** - Start live tracking during active gameweeks

The system is now ready for full FPL Live functionality! 🚀