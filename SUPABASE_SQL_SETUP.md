# 📋 Supabase SQL Setup Instructions

## ✅ **STEP-BY-STEP GUIDE**

### Step 1: Run Main Schema (Database Tables)

1. Open **Supabase Dashboard** → Your LifeOS Project
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**
4. **Copy and paste** entire contents of `supabase-schema-safe.sql`
5. Click **"Run"** button (or press Ctrl+Enter)

✅ **Expected Result:** 
- All tables created successfully
- Message: "Success. No rows returned"
- No errors

⚠️ **If you see errors about "already exists":**
- This is NORMAL if you already ran the schema before
- The new file has `DROP IF EXISTS` so it's safe to run multiple times
- Errors will be ignored, new policies will be created

---

### Step 2: Setup Storage Bucket (For File Uploads)

**IMPORTANT:** Storage buckets **CANNOT** be created via SQL. Use Dashboard instead.

📖 **Follow the guide:** `SUPABASE_STORAGE_SETUP.md`

**Quick Steps:**
1. Dashboard → **Storage** → **"Create a new bucket"**
2. Name: `study-documents`
3. Public: **OFF** (keep unchecked)
4. File size limit: `10485760` (10MB)
5. Click **"Create bucket"**
6. Add 4 RLS policies (copy from `SUPABASE_STORAGE_SETUP.md`)

---

## 🔍 What Gets Created

### Database Tables (11 tables):
- ✅ `users` - User profiles from Firebase
- ✅ `tasks` - To-do items
- ✅ `habits` - Habit tracking
- ✅ `expenses` - Financial tracking
- ✅ `notes` - User notes
- ✅ `subjects` - Study subjects
- ✅ `topics` - Study topics
- ✅ `study_sessions` - Study time logs
- ✅ `documents` - Uploaded file metadata
- ✅ `ai_results` - Cached AI responses

### Security:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Firebase UID used for authentication
- ✅ 30+ RLS policies created
- ✅ Performance indexes on owner_id columns

### Functions & Triggers:
- ✅ `update_updated_at_column()` function
- ✅ Auto-update triggers on 4 tables

---

## ✅ Verification Checklist

After running the SQL:

### Check Tables:
1. Dashboard → **Table Editor**
2. Should see all 10 tables listed
3. Click on any table → should see columns

### Check Policies:
1. Dashboard → **Authentication** → **Policies**
2. Should see policies for each table
3. Example: `users` should have 3 policies

### Check Storage:
1. Dashboard → **Storage**
2. Should see `study-documents` bucket
3. Click bucket → **Policies** → should see 4 policies

---

## 🚀 Ready to Test!

Once both steps complete:

```bash
# Start your app
npm run dev
```

Then test:
1. ✅ Login with Firebase auth
2. ✅ Navigate to `/study`
3. ✅ Upload a PDF → should work!
4. ✅ Click AI buttons → should process!

---

## ❌ Common Errors & Fixes

### Error: "permission denied for schema storage"
**Cause:** Trying to create storage bucket via SQL  
**Fix:** Use Dashboard instead (see `SUPABASE_STORAGE_SETUP.md`)

### Error: "relation already exists"
**Cause:** Tables already created from previous run  
**Fix:** Use `supabase-schema-safe.sql` - it has DROP IF EXISTS

### Error: "policy already exists"
**Cause:** Old schema without DROP POLICY  
**Fix:** Already fixed in `supabase-schema-safe.sql`

### Error: "new row violates row-level security"
**Cause:** RLS policies not set up correctly  
**Fix:** Re-run `supabase-schema-safe.sql`

---

## 📁 Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `supabase-schema.sql` | ❌ OLD - Has errors | Don't use |
| `supabase-schema-safe.sql` | ✅ NEW - Safe to run | **Use this!** |
| `SUPABASE_STORAGE_SETUP.md` | Storage guide | After running SQL |
| `SUPABASE_SQL_SETUP.md` | This file | Setup instructions |

---

## 🎯 Summary

**DO THIS:**
1. ✅ Run `supabase-schema-safe.sql` in SQL Editor
2. ✅ Create storage bucket via Dashboard
3. ✅ Add 4 storage policies
4. ✅ Test by uploading a file

**DON'T DO THIS:**
- ❌ Don't run old `supabase-schema.sql` (has errors)
- ❌ Don't try to create storage via SQL (won't work)
- ❌ Don't skip RLS policies (app will fail)

---

**Questions?** Check `AI_FEATURES_TESTING.md` for full testing guide!
