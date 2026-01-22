# AI Chatbot Error Fix Guide

## 🔴 Error: "Failed to get AI response. Please try again."

### **Root Cause:**
The AI chatbot is failing because the **OPENROUTER_API_KEY** is not configured in your `.env` file.

---

## ✅ **How to Fix:**

### Step 1: Get OpenRouter API Key

1. **Go to:** https://openrouter.ai/
2. **Sign up** for a free account
3. **Go to Keys:** https://openrouter.ai/keys
4. **Create a new API key**
5. **Copy the key** (looks like: `sk-or-v1-...`)

---

### Step 2: Add to .env File

Open `d:\LifeOS\.env` and add/update:

```env
# OpenRouter AI (REQUIRED for chatbot)
OPENROUTER_API_KEY=sk-or-v1-YOUR_ACTUAL_KEY_HERE
OPENROUTER_MODEL=openai/gpt-3.5-turbo-instruct
```

**⚠️ Important:** 
- Replace `YOUR_ACTUAL_KEY_HERE` with your real API key
- The model `openai/gpt-oss-20b:free` might not exist anymore
- Use `openai/gpt-3.5-turbo-instruct` instead (it's free!)

---

### Step 3: Restart Dev Server

After updating `.env`:

```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

**Why?** Next.js loads environment variables on startup. Changes require restart.

---

## 🔍 **Verify Your .env File:**

Your `.env` should have these entries:

```env
# Firebase (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (from Firebase Project Settings > Service Accounts)
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase (from Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenRouter AI ← ADD THIS!
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=openai/gpt-3.5-turbo-instruct
```

---

## 🧪 **Test After Fix:**

1. Restart dev server
2. Open chatbot (bottom-right button)
3. Type: "Hello, test message"
4. Should get AI response!

---

## 🆓 **Free AI Models on OpenRouter:**

If you want completely free AI:

```env
OPENROUTER_MODEL=openai/gpt-3.5-turbo-instruct
```

Or for better quality (still free):

```env
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

See all free models: https://openrouter.ai/models?order=newest&supported_parameters=tools&max_price=0

---

## ❌ **Common Mistakes:**

### Mistake 1: Forgot to restart server
**Fix:** Always restart after changing `.env`

### Mistake 2: API key has quotes
**Wrong:** `OPENROUTER_API_KEY="sk-or-v1-..."`
**Right:** `OPENROUTER_API_KEY=sk-or-v1-...`

### Mistake 3: Using old/wrong model
**Fix:** Use `openai/gpt-3.5-turbo-instruct` or check OpenRouter docs

### Mistake 4: .env file not in root directory
**Fix:** Must be at `d:\LifeOS\.env` (same level as package.json)

---

## 🔧 **Alternative: Use Different AI Provider**

If you don't want to use OpenRouter, you can modify `lib/openrouter.ts` to use:

- **OpenAI** directly
- **Groq** (free, very fast)
- **Anthropic Claude**
- **Google Gemini**

But OpenRouter is easiest since it's already coded!

---

## 📊 **How to Check if It's Working:**

### Browser Console (F12):

Look for errors like:
- ❌ `OpenRouter API error: 401` → Bad API key
- ❌ `OpenRouter API error: 404` → Model doesn't exist
- ✅ No errors → Working!

### Network Tab:

1. Open DevTools (F12) → Network tab
2. Send chat message
3. Look for `/api/ai/chat` request
4. Should return 200 status
5. Response should have AI message

---

## ⚡ **Quick Fix Checklist:**

- [ ] Created OpenRouter account
- [ ] Got API key from https://openrouter.ai/keys
- [ ] Added `OPENROUTER_API_KEY=...` to `.env`
- [ ] Set `OPENROUTER_MODEL=openai/gpt-3.5-turbo-instruct`
- [ ] Restarted dev server (`npm run dev`)
- [ ] Tested chatbot
- [ ] ✅ Working!

---

## 🚨 **Still Not Working?**

Check the terminal running `npm run dev` for errors like:

```
Error: OpenRouter API key is required
```

This confirms the key is missing from `.env`.

---

## 💡 **Pro Tip:**

Keep your `.env` file secure! Never commit it to Git (it's already in `.gitignore`).

If you accidentally expose your API key:
1. Go to https://openrouter.ai/keys
2. Delete the compromised key
3. Create a new one
4. Update `.env`

---

**Need help?** Check `.env.example` for the exact format needed!
