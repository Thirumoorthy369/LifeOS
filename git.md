# Git Setup and Push Guide

## Initial Setup - First Commit to GitHub

Follow these commands in order to push your LifeOS project to GitHub.

### Step 1: Initialize Git (if not already initialized)

```bash
git init
```

### Step 2: Configure Git User (if not configured globally)

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Step 3: Verify .gitignore Exists

Make sure `.gitignore` file exists and contains these important entries:

```
node_modules/
.next/
.env
.env.local
*.log
.DS_Store
dist/
build/
.vercel
.turbo
tsconfig.tsbuildinfo
```

**⚠️ CRITICAL**: The `.env` file should NEVER be committed as it contains sensitive API keys!

### Step 4: Add Remote Repository

```bash
git remote add origin https://github.com/Thirumoorthy369/LifeOS.git
```

### Step 5: Verify Remote is Added

```bash
git remote -v
```

You should see:
```
origin  https://github.com/Thirumoorthy369/LifeOS.git (fetch)
origin  https://github.com/Thirumoorthy369/LifeOS.git (push)
```

### Step 6: Stage All Files

```bash
git add .
```

### Step 7: Create First Commit

```bash
git commit -m "Initial commit: LifeOS with advanced features

- Advanced Task Manager with priority, tags, categories
- Advanced Expense Tracker with budgets and analytics
- Advanced Habit Tracker with calendar and streaks
- Advanced Quick Notes with markdown and folders
- Study Planner with AI integration
- Dark slate theme throughout
- All modules enhanced with professional UI"
```

### Step 8: Rename Branch to main (if needed)

```bash
git branch -M main
```

### Step 9: Push to GitHub

```bash
git push -u origin main
```

If you encounter authentication issues, you may need to use a Personal Access Token (PAT) instead of password.

---

## Alternative: Push with Force (if repository exists)

If the GitHub repository already has content and you want to overwrite it:

```bash
git push -u origin main --force
```

**⚠️ WARNING**: This will overwrite any existing code in the repository!

---

## Quick Reference - All Commands at Once

```bash
# Initialize and setup
git init
git remote add origin https://github.com/Thirumoorthy369/LifeOS.git

# Stage, commit, and push
git add .
git commit -m "Initial commit: LifeOS with advanced features"
git branch -M main
git push -u origin main
```

---

## Future Updates (After First Push)

For subsequent updates, use:

```bash
# Check status
git status

# Stage changes
git add .

# Commit with message
git commit -m "Your commit message here"

# Push to GitHub
git push
```

---

## Common Issues & Solutions

### Issue: Permission Denied

**Solution**: Set up SSH key or use Personal Access Token (PAT)

1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens
2. Generate new token with `repo` permissions
3. Use token as password when prompted

### Issue: Remote Already Exists

**Solution**: Remove and re-add remote

```bash
git remote remove origin
git remote add origin https://github.com/Thirumoorthy369/LifeOS.git
```

### Issue: Divergent Branches

**Solution**: Pull with rebase or force push

```bash
# Option 1: Pull and merge
git pull origin main --allow-unrelated-histories

# Option 2: Force push (overwrites remote)
git push -u origin main --force
```

---

## Verify Your Push

After pushing, visit:
https://github.com/Thirumoorthy369/LifeOS

You should see all your files uploaded!

---

## Remember

✅ **Always check** that `.env` is in `.gitignore`  
✅ **Never commit** API keys or sensitive data  
✅ **Write clear** commit messages  
✅ **Push regularly** to keep backups  

---

## 🚀 You're all set!

Run the commands above and your LifeOS project will be on GitHub!
