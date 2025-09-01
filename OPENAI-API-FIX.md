# 🔧 OpenAI API Fix Summary

## ❌ **Problem:**
```
Error: 400 Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.
```

## ✅ **Solution:**

### 1. **Fixed Parameter:**
```javascript
// OLD (ne radi)
max_tokens: 1000

// NEW (radi)  
max_completion_tokens: 1000
```

### 2. **Updated Model Selection:**
```javascript
// Configurable via environment variables
const defaultModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
const userModel = process.env.USER_OPENAI_MODEL || "gpt-4o";

// Smart model selection
model: userApiKey ? userModel : defaultModel
```

### 3. **Model Strategy:**
- **Free tier**: `gpt-4o-mini` (brži, jeftiniji)
- **User API key**: `gpt-4o` (bolji, korisnik plaća)
- **Configurable**: Preko env varijabli

## 🚀 **How to use GPT-5 Nano:**

Ako želite koristiti `gpt-5-nano`, dodajte u `.env.local`:

```bash
# For free tier users
OPENAI_MODEL=gpt-5-nano

# For users with their own API keys  
USER_OPENAI_MODEL=gpt-5-nano
```

## 🔧 **Environment Variables:**

```bash
# .env.local
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini          # Default model
USER_OPENAI_MODEL=gpt-4o          # Model for user API keys
```

## ✅ **Changes Made:**

1. **File**: `/src/app/api/ai-chat/route.ts`
2. **Parameter**: `max_tokens` → `max_completion_tokens`
3. **Model**: Configurable via env variables
4. **Logic**: Different models for free vs paid users

## 🎯 **Result:**
- ✅ API calls now work without 400 errors
- ✅ Configurable model selection
- ✅ Cost optimization (mini for free, full for paid)
- ✅ Support for GPT-5 nano if available

## 🧪 **Test:**
1. Try AI chat without API key → uses default model
2. Enter your API key → uses user model  
3. Both should work without 400 errors