# Testing the Fixes

## Issues Fixed:

### 1. ✅ AI Usage Counter
**Problem**: Usage counter showed 3/3 even after making requests
**Fix**: Added proper UUID handling in AI chat route
**Location**: `src/app/api/ai-chat/route.ts` lines 108-112

### 2. ✅ Updated Billing Plans
**New limits**: 3 (Free weekly), 10 (Basic monthly), 15 (Premium monthly), 50 (Pro monthly)
**Pricing**: €0, €4.99, €9.99, €14.99

## Test Steps:

### 1. Seed the new plans:
```bash
# Use this API call to seed the plans:
curl -X POST http://localhost:3001/api/seed-test-plans
```

### 2. Reset your usage counter:
```bash
# Reset your AI usage counter:
curl -X POST http://localhost:3001/api/reset-usage
```

### 3. Test AI usage counting:
1. Go to `/premier-league/ai-team-analysis`
2. Ask a question - should show 2/3 remaining after request
3. Ask another question - should show 1/3 remaining
4. Ask third question - should show 0/3 remaining and be blocked

### 4. Test billing plans:
1. Go to `/billing-plans`
2. Should see 4 plans with correct limits (3, 10, 15, 50)
3. Click "Upgrade Now" - should log payment attempt

## Debug Information:
Check the console logs for:
- "Invalid UUID detected" messages
- "Checking rate limit for userId" 
- "Incrementing usage for userId"
- Payment logging in format:
```
=== PAYMENT ATTEMPT ===
User ID: [uuid]
User Email: [email]  
Plan ID: [plan-id]
Payment Method: stripe
Timestamp: [iso-date]
========================
```

## Expected Results:
- ✅ AI usage counter decrements properly after each question
- ✅ Billing plans show new limits (3, 10, 15, 50)
- ✅ Payment attempts are logged correctly
- ✅ All translations work with fallbacks
- ✅ Profile page shows billing plan links