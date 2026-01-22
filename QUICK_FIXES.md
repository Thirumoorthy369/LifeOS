# Quick Fixes Required

## 🔴 **Issue 1: Chatbot Server Error** ✅ FIXED

**Error:** `window is not defined`

**Cause:** Using `window.location.pathname` in server-side rendering

**Fix Applied:** Changed to use Next.js `usePathname()` hook

---

## 🔴 **Issue 2: Supabase RLS Error** (Still needs fixing)

**Error:**
```
Error creating user: {
  code: '42501',
  message: 'new row violates row-level security policy for table "users"'
}
```

**Fix:** Run SQL schema in Supabase

### **Steps to Fix:**

1. **Open Supabase Dashboard** → SQL Editor
2. **Paste and run** the entire `supabase-schema-safe.sql` file
3. This will create all necessary RLS policies

**Quick SQL for just the users table:**

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');
```

---

## ✅ **Status:**

- ✅ Chatbot crash fixed
- ❌ Supabase RLS needs SQL execution

**After running the SQL, restart the server and it will work!**

---

## 🚀 **Test AI Actions:**

Once fixed, try these commands in the chatbot:

1. "Add task: Test the new AI features"
2. "Create habit: Code daily"
3. "Add expense: 100 for lunch"
4. "Show my tasks"
5. "How much did I spend today?"

The AI will execute actions and respond! 🎉
