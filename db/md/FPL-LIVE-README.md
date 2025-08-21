# FPL Live Dashboard

A comprehensive Fantasy Premier League live tracking system with real-time bonus predictions, built with Next.js 15 and Supabase.

## Features

✅ **Real-time Data Fetching** - Server-side FPL API integration with retry logic  
✅ **Live Bonus Prediction** - Advanced BPS calculation with tie-breaking rules  
✅ **Manager Team Tracking** - Load and monitor any FPL manager's squad  
✅ **Live Event Stream** - Real-time goals, assists, cards, and saves tracking  
✅ **Interactive Dashboard** - Modern UI with dark mode support  
✅ **Database Storage** - Comprehensive Supabase schema for data persistence  
✅ **Auto-polling** - Configurable live updates every 15 seconds  

## Quick Start

### 1. Database Setup

Run the database migration to create all required tables:

```sql
-- Execute the contents of db/fpl-live-schema.sql in your Supabase SQL editor
```

### 2. Environment Variables

Add to your `.env.local`:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
FPL_PROXY_URL=https://your-proxy.com
FPL_CRON_SECRET=your_secret_key
```

### 3. Access the Dashboard

Navigate to: `http://localhost:3000/premier-league/fpl-live`

## Usage Guide

### Basic Setup
1. **Enter Manager ID** - Use your FPL Manager ID (default: 133790)
2. **Select Gameweek** - Choose the current gameweek
3. **Load Team** - Click to fetch your squad and current stats

### Live Tracking
1. **Fetch Now** - Manual update of live data
2. **Start Live** - Enable auto-polling every 15 seconds
3. **Monitor Ticker** - View real-time events as they happen

### Understanding the Interface

#### Manager Overview
- **Team Points** - Current total with provisional/final status
- **Captain/Vice** - Multiplied points display
- **Team Stats** - Goals, assists, clean sheets, cards, saves breakdown

#### Squad Table
- **Starting XI + Bench** - All 15 players with live stats
- **BPS Tracking** - Bonus Point System scores
- **Predicted Bonus** - Live bonus predictions until finalized
- **ICT Index** - Influence, Creativity, Threat metrics

#### Scoreboard
- **Live Fixtures** - Real-time scores and match status
- **Bonus Predictions** - Top 3 players per fixture with predicted bonus
- **Match Status** - Pre-match, Live (with minutes), Full-time

#### Live Ticker
- **Real-time Events** - Goals, assists, cards, penalties as they happen
- **Player Names** - Linked to team information
- **Time Stamps** - "X minutes ago" formatting

## API Endpoints

### Core Data Endpoints
- `GET /api/fpl/bootstrap` - Player, team, and position data
- `GET /api/fpl/fixtures?gw=X` - Fixtures and stats for gameweek X
- `GET /api/fpl/live?gw=X` - Live player stats for gameweek X
- `GET /api/fpl/manager?managerId=X&gw=Y` - Manager team for specific GW

### Team Management
- `POST /api/fpl/load-team` - Load complete manager data with predictions
- `POST /api/fpl/poll` - Manual/automated polling trigger
- `GET /api/fpl/events?gw=X` - Recent events stream

### Settings
- `GET /api/fpl/settings` - Retrieve FPL configuration
- `POST /api/fpl/settings` - Update default settings

## Database Schema

### Core Tables
- **fpl_players** - Player master data (names, teams, positions)  
- **fpl_teams** - Team information (names, short codes)
- **fpl_fixtures** - Match data (scores, status, timing)
- **fpl_live_players** - Live stats per gameweek per player
- **fpl_manager_picks** - Manager team selections per gameweek

### Event Tracking
- **fpl_events_stream** - Real-time event log (goals, assists, cards)
- **fpl_fixture_stats** - Detailed fixture statistics with deltas
- **fpl_gameweek_status** - Bonus finalization tracking

### Management
- **fpl_settings** - App configuration (proxy, secrets, defaults)
- **fpl_manager_metrics** - Cached manager performance data

## Bonus Prediction Algorithm

The bonus system follows official FPL rules:

### BPS Distribution
- **3 points** - Highest BPS in the match
- **2 points** - Second highest BPS  
- **1 point** - Third highest BPS

### Tie-Breaking Rules
- **Tied for 1st** - Multiple players get 2nd place points
- **Tied for 2nd** - Multiple players get 3rd place points  
- **Tied for 3rd** - Multiple players get 1 point each

### Implementation
```typescript
// Example usage
const bonuses = bonusPredictor.calculateAllFixturesBonuses(fixtures, players);
const playerBonus = bonusPredictor.getPlayerPredictedBonus(playerId, bonuses);
```

## Live Polling System

### Client-side Polling
```typescript
// Automatic 15-second intervals
const startPolling = () => {
  setInterval(fetchLatestData, 15000);
};
```

### Server-side Event Detection
```typescript
// Delta detection between API calls
const detectNewEvents = (previousStats, currentStats) => {
  return currentStats.filter(stat => 
    stat.value > previousStats[stat.player_id]?.value
  );
};
```

## Technical Architecture

### Frontend (Next.js 15)
- **React 19** with hooks for state management
- **Tailwind CSS** for responsive styling  
- **TypeScript** for type safety
- **Real-time updates** with client-side polling

### Backend (API Routes)
- **Server-side data fetching** to avoid CORS issues
- **Retry logic** with exponential backoff
- **Error handling** with detailed logging
- **Rate limiting** protection

### Database (Supabase)
- **PostgreSQL** with Row Level Security
- **Real-time subscriptions** capability  
- **Automatic timestamps** with triggers
- **Optimized indexes** for performance

## Security Considerations

### API Protection
- All FPL API calls server-side only
- Optional proxy URL configuration
- CRON secret for automated polling
- Rate limiting on endpoints

### Data Privacy
- No user authentication required for viewing
- Manager data is public FPL information
- Supabase RLS policies configured
- Service role key secured server-side

## Troubleshooting

### Common Issues

**"Manager not found"**
- Verify the Manager ID is correct
- Check if the manager has played the gameweek

**"No live data"**  
- Ensure gameweek has started
- Check if fixtures are live/finished
- Verify API connectivity

**"Bonus predictions wrong"**
- Predictions are provisional until match end
- BPS can change during matches
- Final bonus shown after "bonus_added" = true

**"Polling not working"**
- Check browser console for errors
- Verify network connectivity  
- Confirm gameweek has active fixtures

### Debug Information
- Check `/api/fpl/bootstrap` for basic connectivity
- Monitor Network tab for API call failures
- Review Supabase logs for database errors

## Contributing

The system is built with maximum reusability in mind:

### Code Organization
- **Services** (`/lib`) - Reusable API and database logic
- **Components** (`/components/fpl`) - UI components with TypeScript interfaces  
- **API Routes** (`/app/api/fpl`) - RESTful endpoints with error handling
- **Database** (`/db`) - SQL migrations and schema

### Adding Features
1. Extend the database schema in `fpl-live-schema.sql`
2. Add new API endpoints following existing patterns
3. Create reusable components with proper TypeScript types
4. Update the main dashboard page to integrate new features

## Support

For issues or questions:
- Check this README for common solutions
- Review the browser console for client-side errors  
- Check Supabase logs for database issues
- Verify all environment variables are set correctly

---

**Built with ❤️ for the FPL community**

*This is an unofficial tool. Fantasy Premier League is owned by the Premier League.*