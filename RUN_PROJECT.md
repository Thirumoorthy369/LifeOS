# 🚀 How to Run LifeOS

## ⚡ Quick Start (If Already Configured)

If you've already set up Firebase and Supabase, just run:

```bash
npm run dev
```

Then open: **http://localhost:3000**

---

## 📋 Complete Setup & Run Guide

### Step 1: Install Dependencies (First Time Only)

```bash
cd d:/LifeOS
npm install
```

**This installs all required packages. Takes ~2-3 minutes.**

---

### Step 2: Configure Environment Variables

Create a file called `.env.local` in `d:/LifeOS/` with your credentials:

```env
# Firebase (Get from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Supabase (Get from Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional (for AI features later)
OPENROUTER_API_KEY=your_openrouter_key
```

**See `SETUP_GUIDE.md` for detailed Firebase/Supabase setup instructions.**

---

### Step 3: Run the Development Server

```bash
npm run dev
```

**You should see:**
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

---

### Step 4: Open in Browser

Open your browser and go to:

**http://localhost:3000**

You should see the LifeOS login page! 🎉

---

## 🎯 What You'll See

### If Configuration is Complete:
✅ Login page with email/password fields  
✅ "Continue with Google" button  
✅ Calm dark theme with ambient gradient  

### If Configuration is Missing:
❌ Browser console errors about missing Firebase config  
❌ Authentication won't work  

**Solution:** Make sure `.env.local` exists with all required values.

---

## 🧪 Test Your Setup

### Test 1: Sign Up
1. Click "Sign Up" at the bottom
2. Enter email: `test@example.com`
3. Enter password: `test123`
4. Click "Sign Up"
5. You should be redirected to `/dashboard`

### Test 2: Check Firebase
1. Go to Firebase Console → Authentication → Users
2. You should see `test@example.com` listed

### Test 3: Check Supabase
1. Go to Supabase Dashboard → Table Editor → `users`
2. You should see a row with the test user

### Test 4: Sign Out & Sign In
1. Click "Sign Out" in dashboard
2. Go back to login page
3. Enter same credentials
4. Click "Sign In"
5. You should be logged in again

---

## 📦 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🛠️ Development Workflow

### Normal Workflow:
```bash
# 1. Open terminal in d:/LifeOS
cd d:/LifeOS

# 2. Start dev server
npm run dev

# 3. Open browser
# http://localhost:3000

# 4. Make changes to code
# Files auto-reload on save

# 5. Stop server (when done)
# Press Ctrl+C in terminal
```

---

## 🔧 Troubleshooting

### Error: "Cannot find module"
**Solution:**
```bash
npm install
```

### Error: "Firebase: Error (auth/invalid-api-key)"
**Solution:** Check that `.env.local` has correct Firebase API key.

### Error: "Network request failed"
**Solution:** 
1. Check internet connection
2. Verify Supabase URL in `.env.local`
3. Check Supabase project is running

### Port 3000 Already in Use
**Solution:**
```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000

# Then run again
npm run dev
```

### Changes Not Reflecting
**Solution:**
1. Save the file (Ctrl+S)
2. Wait for auto-refresh
3. Or manually refresh browser (F5)
4. Or restart dev server (Ctrl+C, then `npm run dev`)

---

## 🌐 Access from Other Devices (Optional)

To test on your phone or tablet:

1. Find your computer's IP address:
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

2. Run dev server:
```bash
npm run dev
```

3. On your phone/tablet, open browser and visit:
```
http://192.168.1.100:3000
```

**Note:** Both devices must be on the same WiFi network.

---

## 🎨 Development Tips

### Hot Reload
- Changes to `.tsx`, `.ts` files → Auto-reload
- Changes to `.css` files → Auto-reload
- Changes to `.env.local` → **Restart server required**

### Browser DevTools
Open with `F12` to see:
- Console logs
- Network requests
- Storage (IndexedDB, LocalStorage)

### React DevTools
Install Chrome extension for better debugging:
https://chrome.google.com/webstore/detail/react-developer-tools

---

## 📁 Key Files That Auto-Update

When you run `npm run dev`, these files are watched:

- `app/**/*.tsx` - Pages and components
- `components/**/*.tsx` - UI components
- `lib/**/*.ts` - Utilities and logic
- `app/globals.css` - Global styles

**No need to restart for these files!**

---

## 🚦 Project Status Checklist

Before running, make sure:

- [x] Node.js installed (v18+)
- [x] npm installed
- [x] Dependencies installed (`npm install` completed)
- [ ] `.env.local` file created
- [ ] Firebase project created
- [ ] Supabase project created
- [ ] Supabase schema run (`supabase-schema.sql`)

**If all checked:** Run `npm run dev` and you're good to go! ✅

---

## 🎯 Next Steps After Running

Once the app is running:

1. ✅ Test authentication (email/password + Google)
2. ✅ Explore the dashboard
3. ✅ Check network status indicator (online/offline)
4. 🚀 I'll continue building:
   - Task management
   - Habit tracker
   - Expense tracker
   - Study planner
   - AI features

---

## 📞 Need Help?

If you encounter issues:
1. Check the error message in terminal
2. Check browser console (F12)
3. Verify `.env.local` values
4. Ensure Firebase/Supabase projects are active
5. Let me know the error and I'll help fix it!

---

**Ready to build something amazing! 🚀**
