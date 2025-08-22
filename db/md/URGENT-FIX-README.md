# 🚨 URGENT: Database Schema Fix

The error you're seeing is because the database table structure doesn't match what the FPL API returns. 

## ⚡ QUICK FIX (2 minutes)

### Step 1: Run Database Update
1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the entire contents of `complete-db-fix.sql`**
4. **Click "Run"**

This will add all missing columns to match the FPL API structure.

### Step 2: Test the Fix
1. **Restart your dev server**: `npm run dev`
2. **Go to**: `http://localhost:3000/premier-league/fpl-live`
3. **Click "Load Team"** - should work without errors now

## 🔍 What Was Wrong

The FPL API returns much more data than we initially accounted for:

### Element Types (Positions)
- **Missing**: `element_count`, `squad_select`, `ui_shirt_specific`, etc.
- **Added**: All 8 missing columns to `fpl_element_types` table

### Teams  
- **Missing**: `strength`, `position`, `pulse_id`, strength ratings, etc.
- **Added**: All 17 missing columns to `fpl_teams` table

### Players
- **Missing**: `status`, `form`, `photo`, transfer data, etc.  
- **Added**: All 10 missing columns to `fpl_players` table

## ✅ After the Fix

You should see:
- ✅ Settings load without errors
- ✅ "Load Team" works with Manager ID 133790
- ✅ All FPL data syncs correctly
- ✅ Live polling functions properly

## 🔧 What the Fix Does

The `complete-db-fix.sql` script:
1. **Adds missing columns** to all FPL tables
2. **Updates RLS policies** for better access
3. **Maintains data integrity** with proper constraints
4. **Preserves existing data** (safe to run)

## 🚀 Ready to Test

After running the SQL fix, your FPL Live system will be fully functional!

**Test Path**: Load Manager ID `133790` with Gameweek `1` to verify everything works.