# Deployment Guide

## FPL API 403 Error Fix

If you're getting `HTTP 403: Forbidden` errors when trying to access FPL API in production, this is because the FPL API blocks requests from production servers.

### Solution

1. **Set environment variable:**
   ```bash
   FPL_USE_PROXY=true
   ```

2. **The app will automatically:**
   - Try direct FPL API call first
   - On 403 error, fall back to internal proxy endpoints
   - Try multiple proxy methods for reliability

### How it works

1. **Direct API Call** - Tries `https://fantasy.premierleague.com/api/...` directly
2. **Internal Proxy** - Uses `/api/fpl/proxy` endpoint with proper headers
3. **CORS Proxy** - Falls back to `/api/fpl/cors-proxy` using public CORS services

### Environment Variables

Add to your production environment:

```bash
# FPL API Configuration
FPL_USE_PROXY=true  # Enable proxy fallback for production

# Other required variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret
```

### Deployment Platforms

#### Vercel
1. Add environment variables in Vercel dashboard
2. Set `FPL_USE_PROXY=true`
3. Deploy

#### Netlify
1. Add environment variables in Netlify dashboard  
2. Set `FPL_USE_PROXY=true`
3. Deploy

#### Docker/VPS
1. Add to your `.env` file:
   ```bash
   FPL_USE_PROXY=true
   ```
2. Restart the application

### Monitoring

The app logs proxy usage:
- `🔄 FPL direct call failed (403), trying proxy fallback...`
- `🔄 Trying proxy: /api/fpl/proxy`
- `✅ Proxy success: /api/fpl/proxy`
- `❌ Proxy failed: /api/fpl/proxy`

### Troubleshooting

1. **Still getting 403 errors?**
   - Check that `FPL_USE_PROXY=true` is set
   - Check deployment logs for proxy attempts

2. **Slow response times?**
   - Normal - proxy adds latency
   - CORS proxies are slower than direct calls
   - Consider implementing caching

3. **All proxies failing?**
   - Public CORS services may be down
   - Check network connectivity
   - Consider implementing your own proxy server