# LifeOS Setup Guide

## 📋 Overview
This guide walks you through setting up Firebase Authentication and Supabase Database for LifeOS.

## 🔥 Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. **Project Name**: `lifeos` (or any name you prefer)
4. Disable Google Analytics (optional for single-user app)
5. Click **"Create project"**

### 1.2 Enable Authentication Methods

#### Enable Email/Password Authentication:
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **"Email/Password"**
3. Toggle **"Enable"** to ON
4. Toggle **"Email link (passwordless sign-in)"** to OFF (we're using password)
5. Click **"Save"**

**Note about Email Verification:**
- Firebase Email/Password doesn't send OTP codes
- Instead, it uses **Email Verification Links**
- After signup, users receive a verification email with a link
- We can add this feature if you want email verification

#### Enable Google Sign-In:
1. Still in **Sign-in method**, click **"Google"**
2. Toggle **"Enable"** to ON
3. Enter a **"Project support email"** (your email)
4. Click **"Save"**

### 1.3 Get Firebase Config Keys
1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to **"Your apps"** section
3. Click **"Web"** icon (</>) to add a web app
4. **App nickname**: `LifeOS Web`
5. **DO NOT** check "Firebase Hosting"
6. Click **"Register app"**
7. Copy the `firebaseConfig` object values

You'll see something like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "lifeos-xxxxx.firebaseapp.com",
  projectId: "lifeos-xxxxx",
  appId: "1:123456789:web:abcdefghijk"
};
```

### 1.4 Add to `.env.local`
Create `d:/LifeOS/.env.local` and add:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lifeos-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lifeos-xxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdefghijk
```

---

## 💾 Step 2: Supabase Setup

### 2.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. **Name**: `lifeos` (or any name)
4. **Database Password**: Create a strong password (save it!)
5. **Region**: Choose closest to you
6. Click **"Create new project"** (takes ~2 minutes)

### 2.2 Run SQL Schema
1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `d:/LifeOS/supabase-schema.sql` in your code editor
4. **Copy the ENTIRE contents** of that file
5. **Paste** into the Supabase SQL Editor
6. Click **"Run"** (bottom right)
7. You should see: **"Success. No rows returned"**

This creates all tables with Row Level Security (RLS) enabled.

### 2.3 Create Storage Bucket (for Study Materials)
1. Go to **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. **Name**: `study-materials`
4. **Public bucket**: Toggle OFF (keep private)
5. Click **"Create bucket"**

#### Add Storage Policy:
1. Click on the `study-materials` bucket
2. Click **"Policies"** tab
3. Click **"New policy"** → **"For full customization"**
4. **Policy name**: `Users can manage own files`
5. **Target roles**: `authenticated`
6. **Policy definition** → Click **"Review"** → **"Use this template"**
7. Replace with this SQL:

```sql
CREATE POLICY "Users can manage own files"
ON storage.objects FOR ALL
USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);
```

8. Click **"Save policy"**

### 2.4 Get Supabase Keys
1. Go to **Project Settings** (gear icon) → **API**
2. Find **"Project URL"**: `https://xxxxx.supabase.co`
3. Find **"anon public"** key (long string starting with `eyJ...`)

### 2.5 Add to `.env.local`
Add these to your `d:/LifeOS/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2Mzk1ODg4MDAsImV4cCI6MTk1NTE2NDgwMH0.xxxxxxxxxxxxx
```

---

## 🔗 Step 3: Connect Firebase to Supabase

### 3.1 Configure Supabase to Accept Firebase JWTs

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Scroll to **"Firebase"** section
3. You'll see: **"Use Firebase alongside Supabase Auth"**
4. We'll use a custom JWT integration instead

#### Get Firebase Service Account (for backend verification):
1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Download the JSON file
4. Open the JSON file and copy:
   - `client_email`
   - `private_key` (the entire multi-line string)

### 3.2 Add Backend Secrets to `.env.local`
Add these to `d:/LifeOS/.env.local`:
```env
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@lifeos-xxxxx.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
```

**Important:** Keep the `private_key` as a single line with `\n` characters.

### 3.3 How the Integration Works

```
User Login Flow:
1. User signs in with Firebase (Google or Email/Password)
2. Firebase returns a user object with UID
3. You call /api/auth/sync to sync user to Supabase
4. Supabase creates/updates user record with firebase_uid
5. All future API calls use Firebase JWT
6. Supabase RLS policies check firebase_uid matches
```

---

## 🎯 Step 4: Final `.env.local` Example

Here's what your complete `d:/LifeOS/.env.local` should look like:

```env
# Firebase Authentication (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lifeos-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lifeos-xxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdefghijk

# Supabase Database (Public)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase Admin (Backend Secret)
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@lifeos-xxxxx.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"

# Supabase Service Role (Backend Secret) - Optional for now
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenRouter AI (Backend Secret) - Optional for now
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Session
SESSION_MAX_IDLE_TIME=3600
```

---

## ✅ Step 5: Verify Setup

Once you've added all environment variables:

1. **Restart the Next.js dev server** (if running):
   ```bash
   npm run dev
   ```

2. **Open** `http://localhost:3000`

3. **Test Sign Up**:
   - Try signing up with email/password
   - Check Firebase Console → Authentication → Users (user should appear)
   - Check Supabase → Table Editor → `users` table (user should sync)

4. **Test Google Sign In**:
   - Try Google authentication
   - Same verification steps

---

## 📧 Optional: Email Verification

If you want users to verify their email after signup:

1. In Firebase Console → **Authentication** → **Templates**
2. Configure **"Email address verification"** template
3. Update signup code to send verification email

I can add this feature if you'd like!

---

## 🔐 Security Notes

- ✅ **Frontend uses only public keys** (NEXT_PUBLIC_*)
- ✅ **Backend secrets never exposed** to client
- ✅ **Row Level Security (RLS)** enforced on all tables
- ✅ **Firebase UID used as owner_id** for data isolation
- ✅ **Storage policies** ensure users can only access their files

---

## 🚀 Next Steps

After setup is complete:
1. I'll create the dashboard UI
2. Implement Tasks, Habits, Expenses, Notes modules
3. Build the Study Planner with AI features
4. Add PWA offline capabilities

Let me know when you've completed the setup and I'll continue building!
