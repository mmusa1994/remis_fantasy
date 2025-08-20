# Security Migration: Admin Database Access

## Overview

This migration moves all admin database access from client-side to server-side endpoints and enables Row Level Security (RLS) for better security.

## Changes Made

### 1. Server-Side Supabase Client

- **File**: `src/lib/supabase-server.ts`
- **Purpose**: Creates a server-only Supabase client using the service role key
- **Security**: Prevents client-side access to sensitive database operations

### 2. Secure Admin API Endpoints

- **File**: `src/app/api/admin/registrations/route.ts`
- **Endpoints**:

  - `GET` - Fetch all registrations (admin only)
  - `PUT` - Update full registration record (admin only)
  - `PATCH` - Update specific fields (admin only)
  - `DELETE` - Soft delete registration (admin only)

- **File**: `src/app/api/admin/storage/route.ts`
- **Endpoint**: `POST` - Get signed URLs for payment proofs (admin only)

### 3. Updated Client-Side Code

- **File**: `src/app/admin/dashboard/page.tsx`
- **Changes**:
  - Removed direct Supabase client import
  - Replaced all `supabase.from()` calls with `fetch()` to secure API endpoints
  - All database operations now go through authenticated server routes

### 4. Updated Email API

- **File**: `src/app/api/send-email/route.ts`
- **Changes**: Now uses server-side Supabase client for database updates

### 5. Row Level Security

- **File**: `db/enable-rls-and-policies.sql`
- **Changes**:
  - Enabled RLS on `registration_25_26` table
  - Added policies for public registration (INSERT only)
  - Added policies for admin full access
  - Added policies for users to access their own data

## Security Benefits

1. **No Client-Side Database Access**: Admin dashboard no longer uses public/anon Supabase client
2. **Server-Side Authentication**: All admin operations verify session on server
3. **Row Level Security**: Database-level access control
4. **Service Role Key**: Admin operations use privileged service role key
5. **API Rate Limiting**: Existing rate limiting still applies

## Deployment Steps

1. **Run Database Migration**:

   ```sql
   -- Execute the contents of db/enable-rls-and-policies.sql
   ```

2. **Environment Variables**: Ensure these are set:

   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

3. **Test Admin Dashboard**: Verify all CRUD operations work through new API endpoints

## Rollback Plan

If issues arise, you can temporarily disable RLS:

```sql
ALTER TABLE registration_25_26 DISABLE ROW LEVEL SECURITY;
```

## Monitoring

- Monitor API endpoints for 401/403 errors
- Check server logs for authentication failures
- Verify admin dashboard functionality

## Future Improvements

1. Add request logging for admin operations
2. Implement audit trails for data changes
3. Add IP whitelisting for admin access
4. Consider implementing 2FA for admin accounts
