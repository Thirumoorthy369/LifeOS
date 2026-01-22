# 🚀 LifeOS - Quick Commands

## ▶️ Start Development Server

```bash
npm run dev
```

**Opens at:** http://localhost:3000

---

## 🛑 Stop Server

Press `Ctrl + C` in the terminal

---

## 🔄 Restart Server (If Issues)

### Windows PowerShell:
```bash
# Kill port 3000
npx kill-port 3000

# Clean build cache
Remove-Item -Path .next -Recurse -Force

# Start server
npm run dev
```

### Quick One-Liner:
```bash
npx kill-port 3000; Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue; npm run dev
```

---

## 📦 Other Useful Commands

```bash
# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

---

## 🌐 Access URLs

- **Local:** http://localhost:3000
- **Network:** http://192.168.56.1:3000 (for other devices)

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
npx kill-port 3000
```

### Clean Build Cache
```bash
Remove-Item -Path .next -Recurse -Force
```

### Reset Everything
```bash
# Delete node_modules and reinstall
Remove-Item -Path node_modules -Recurse -Force
npm install
```

---

## 📁 Important Files

- **Environment:** `.env.local` (your credentials)
- **Run Guide:** `RUN_PROJECT.md`
- **Setup Guide:** `SETUP_GUIDE.md`
- **Database Schema:** `supabase-schema.sql`

---

## ✅ Server Running Checklist

```
✓ Server started successfully
✓ Port: 3000
✓ URL: http://localhost:3000
✓ Hot reload: Enabled
✓ Environment: .env.local
```

---

## 🎯 What's Next?

1. Open http://localhost:3000
2. See the login page
3. Configure Firebase/Supabase (see SETUP_GUIDE.md)
4. Test authentication
5. Start using LifeOS!

---

**Server is running in the background. Don't close this terminal!** 🚀
