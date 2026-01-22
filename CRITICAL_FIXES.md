# Critical Fixes Required

## 🔴 **3 Issues Found**

### **Issue 1: OpenRouter Model Still Wrong**

**Error in terminal:**
```
OpenRouter API error: 400 - {"error":{"message":"Provider returned error"...
```

**Your `.env` file (line 31) likely still has:**
```env
OPENROUTER_MODEL=openai/gpt-oss-20b:free
```

**Fix:** Change to:
```env
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

---

### **Issue 2: Supabase RLS Policy Error**

**Error in terminal:**
```
new row violates row-level security policy for table "users"
```

**This means:** The Supabase database policies aren't set up correctly.

**Fix:**
1. Open Supabase Dashboard → SQL Editor
2. Run the entire `supabase-schema-safe.sql` file
3. This will create the RLS policies

**Quick SQL to fix user table:**
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (id = current_setting('request.jwt.claims', true)::json->>'sub');
```

---

### **Issue 3: Chatbot Input Text Color** ✅ **FIXED**

Changed input textbox color to black for better visibility.

---

## ✅ **Action Plan**

### Step 1: Fix OpenRouter Model
```bash
# Edit .env file
# Change line 31 to:
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free

# Stop server
Ctrl+C

# Restart server
npm run dev
```

### Step 2: Fix Supabase Database
1. Open https://supabase.com/dashboard
2. Go to your LifeOS project
3. Click "SQL Editor" in sidebar
4. Click "New Query"
5. Copy/paste entire `supabase-schema-safe.sql` file
6. Click "Run"

### Step 3: Test
1. Refresh browser
2. Try Google login → should work
3. Try chatbot → should work
4. Input text → should be black ✅

---

## 🔍 **Quick Diagnostic**

**To check if model is correct:**
```bash
# In your terminal, check .env:
cat .env | grep OPENROUTER_MODEL

# Should show:
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

**To check if Supabase is set up:**
- Go to Supabase Dashboard → Table Editor
- Click on "users" table
- Click "Policies" tab
- Should see 3 policies listed

---

## 📝 **Summary**

| Issue | Status | Fix |
|-------|--------|-----|
| Chatbot text color | ✅ Fixed | Changed to black |
| OpenRouter model | ❌ Needs fix | Change in `.env` |
| Supabase RLS | ❌ Needs fix | Run SQL script |

**After fixing OpenRouter model and Supabase, everything will work!**
