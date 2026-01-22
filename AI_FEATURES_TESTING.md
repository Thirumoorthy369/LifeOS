# AI Features Testing Guide

## ✅ Implemented Features

### 1. **Backend API Routes** (with security)
- ✅ `/api/ai/chat` - General AI chatbot
- ✅ `/api/ai/document` - Document processing (summarize, quiz, explain, Q&A)
- ✅ `/api/ai/upload` - Secure file upload with text extraction

### 2. **Study Planner** (`/study` page)
- ✅ Document upload (PDF, images)
- ✅ AI-powered features:
  - Summarize documents
  - Generate quizzes
  - Explain concepts
  - Q&A from documents
- ✅ Document library management
- ✅ Subject organization

### 3. **AI Chatbot Widget**
- ✅ Floating chat button (bottom-right)
- ✅ Context-aware responses (knows your tasks, notes, habits)
- ✅ Chat history persistence
- ✅ Minimizable interface

### 4. **Security Measures**
- ✅ Firebase Authentication on all routes
- ✅ Rate limiting (20 chats/hour, 10 document processes/hour, 5 uploads/hour)
- ✅ Input sanitization (XSS protection)
- ✅ File validation (type, size, magic bytes)
- ✅ Output sanitization
- ✅ Quota tracking

## 🧪 How to Test

### Step 1: Install Dependencies
```bash
npm install
```

The system already installed `pdf-parse` for PDF text extraction.

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Test AI Chatbot
1. Login to your app
2. Look for floating blue/purple chat button (bottom-right corner)
3. Click it to open chatbot
4. Try asking:
   - "What are my current tasks?"
   - "Summarize my notes"
   - "What habits am I tracking?"
   - Any general productivity question

**Expected behavior:**
- AI responds with context about your data
- Chat history persists
- Quota info shown
- Rate limiting after 20 messages

### Step 4: Test Study Planner
1. Navigate to `/study` page (add link in dashboard or type URL)
2. **Upload a document:**
   - Click upload area
   - Choose a PDF or image (max 10MB)
   - Wait for text extraction
3. **Test AI features:**
   - Click "Summarize" - get document summary
   - Click "Create Quiz" - generate quiz questions
   - Click "Explain" - get detailed explanations
4. **Check quotas:**
   - Upload quota: 5/hour
   - Processing quota: 10/hour

**Expected behavior:**
- File uploads successfully
- Text extracted from PDF
- AI processes document
- Results display nicely
- Rate limits enforced

### Step 5: Security Testing

#### Test 1: Authentication
```bash
# Try accessing without token (should fail with 401)
curl http://localhost:3000/api/ai/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

#### Test 2: Rate Limiting
- Send 21 chat requests rapidly
- 21st request should return 429 (Too Many Requests)
- Response includes retry-after header

#### Test 3: File Upload Security
- Try uploading .exe file (should reject)
- Try uploading 20MB file (should reject)
- Try uploading fake PDF (wrong magic bytes - should reject)

#### Test 4: XSS Protection
- Send message with `<script>alert('xss')</script>`
- Response should be sanitized

## 🔧 Configuration

### Environment Variables Required
```env
# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-oss-20b:free

# Firebase Admin (for auth verification)
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Supabase Setup
Run the updated `supabase-schema.sql` which includes:
- Storage bucket for documents
- RLS policies for document access
- ai_results table for caching

## 🎯 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/ai/chat` | 20 requests | 1 hour |
| `/api/ai/document` | 10 requests | 1 hour |
| `/api/ai/upload` | 5 uploads | 1 hour |

## 🐛 Troubleshooting

### Issue: "Cannot find module 'pdf-parse'"
**Solution:** Run `npm install` again

### Issue: "OpenRouter API error"
**Solution:** Check `OPENROUTER_API_KEY` in .env

### Issue: "Unauthorized" on API calls
**Solution:** Ensure user is logged in with Firebase auth

### Issue: File upload fails
**Solution:** 
1. Check Supabase storage bucket exists
2. Verify RLS policies are applied
3. Check file size < 10MB

### Issue: Rate limit too strict
**Solution:** Adjust limits in `lib/rate-limiter.ts`:
```typescript
export const RATE_LIMITS = {
    AI_CHAT: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50/hour
    AI_DOCUMENT: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
    FILE_UPLOAD: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10/hour
}
```

## 📊 API Response Examples

### Chat API
```json
{
  "response": "You have 3 active tasks: ...",
  "usage": {
    "remaining": 19,
    "resetAt": "2025-12-28T20:00:00.000Z"
  }
}
```

### Document API
```json
{
  "response": "Summary: This document discusses...",
  "cached": false,
  "usage": {
    "remaining": 9,
    "resetAt": "2025-12-28T20:00:00.000Z"
  }
}
```

### Upload API
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "name": "document.pdf",
    "type": "pdf",
    "url": "https://...",
    "extractedText": "Full text here...",
    "hasText": true
  },
  "usage": {
    "remaining": 4,
    "resetAt": "2025-12-28T20:00:00.000Z"
  }
}
```

## ✨ Next Steps (Optional Enhancements)

- [ ] Add OCR for images (currently placeholder)
- [ ] Implement quiz result tracking
- [ ] Add study analytics dashboard
- [ ] Create subject/topic management UI
- [ ] Add study session timer
- [ ] Implement flashcards generation
- [ ] Add  collaborative study features

## 🔒 Security Checklist

- ✅ Firebase auth on all AI endpoints
- ✅ Rate limiting per user
- ✅ Input sanitization
- ✅ Output sanitization
- ✅ File type validation (client + server)
- ✅ Magic byte verification
- ✅ File size limits
- ✅ Supabase RLS policies
- ✅ API key server-side only
- ✅ Error handling without data leakage
