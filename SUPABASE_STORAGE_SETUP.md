# Supabase Storage Setup Guide

## ⚠️ IMPORTANT: Storage Bucket Cannot Be Created via SQL

Supabase storage buckets must be created via the **Dashboard UI** or **Management API**.

## 📋 Steps to Create Storage Bucket

### Option 1: Via Supabase Dashboard (Recommended - Easiest)

1. **Go to Supabase Dashboard:**
   - Open https://supabase.com/dashboard
   - Select your LifeOS project

2. **Navigate to Storage:**
   - Click **"Storage"** in the left sidebar
   - Click **"Create a new bucket"** button

3. **Configure Bucket:**
   ```
   Name: study-documents
   Public: OFF (unchecked)
   File size limit: 10485760 (10MB)
   Allowed MIME types: application/pdf, image/png, image/jpeg, image/jpg
   ```

4. **Click "Create bucket"**

5. **Set Up Policies:**
   After bucket is created, go to **Storage > study-documents > Policies**
   
   Click **"New Policy"** and create these 4 policies:

---

### Policy 1: Upload Documents
```sql
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### Policy 2: Read Documents
```sql
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'study-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### Policy 3: Update Documents
```sql
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'study-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### Policy 4: Delete Documents
```sql
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'study-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### Option 2: Via SQL Editor (Limited - Use Dashboard Instead)

**WARNING:** This may not work in all Supabase versions. Use Dashboard if this fails.

```sql
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Try to insert bucket (may fail - use Dashboard if it does)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'study-documents',
  'study-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Then run the 4 policies above
```

---

## ✅ Verification

After setting up, verify by:

1. **Check bucket exists:**
   - Dashboard > Storage > Should see "study-documents"

2. **Check policies:**
   - Click on bucket > Policies tab
   - Should see 4 policies listed

3. **Test upload:**
   - Run your app
   - Navigate to /study
   - Try uploading a PDF
   - Should succeed without errors

---

## 🔧 If Upload Fails

**Common Errors:**

### Error: "new row violates row-level security policy"
**Fix:** Policies not set correctly. Re-check policies in Dashboard.

### Error: "Bucket not found"
**Fix:** Create bucket via Dashboard first.

### Error: "File too large"
**Fix:** Check file is < 10MB, or increase limit in bucket settings.

### Error: "Invalid file type"
**Fix:** Check file is PDF, PNG, or JPEG.

---

## 🎯 Final Checklist

- [ ] Bucket "study-documents" created
- [ ] Bucket is set to **private** (not public)
- [ ] File size limit is 10MB
- [ ] Allowed MIME types include PDF and images
- [ ] All 4 RLS policies created
- [ ] Tested upload from /study page
- [ ] Files visible only to owner

---

## 📸 Expected Dashboard View

After setup, your Storage section should show:

```
Storage
├── study-documents (Private, 10MB limit)
│   └── Policies (4)
│       ├── Users can upload own documents
│       ├── Users can read own documents
│       ├── Users can update own documents
│       └── Users can delete own documents
```
