# OpenRouter Model Fix

## 🔴 Problem Found!

Your API key is correct, but the **model name is wrong**:

**Current (WRONG):**
```
OPENROUTER_MODEL=openai/gpt-oss-20b:free
```

This model doesn't exist or was deprecated.

---

## ✅ **Fix: Use a Working Free Model**

Open your `.env` file and change line 31 to one of these:

### **Option 1: Fast & Reliable (Recommended)**
```env
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

### **Option 2: OpenAI Compatible**
```env
OPENROUTER_MODEL=openai/gpt-3.5-turbo-instruct
```

### **Option 3: Google Gemini (Free)**
```env
OPENROUTER_MODEL=google/gemini-flash-1.5
```

### **Option 4: Mistral (Free)**
```env
OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free
```

---

## 🎯 **Quick Fix**

**Your `.env` should have:**

```env
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

---

## 🔄 **After Changing**

1. **Save** `.env` file
2. **Stop** server (Ctrl+C in terminal)
3. **Restart**: `npm run dev`
4. **Test** chatbot - should work now!

---

## 📋 **Why This Happened**

- The `.env.example` file had an outdated model name
- `openai/gpt-oss-20b:free` doesn't exist on OpenRouter
- OpenRouter returns 503 when model is not found

---

## ✅ **How to Verify**

After restarting:

1. Open chatbot (bottom-right button)
2. Type: "Hello"
3. Should get AI response!

If still error, check terminal for detailed error message.

---

## 🆓 **All Free Models on OpenRouter**

Check latest: https://openrouter.ai/models?max_price=0

**Popular Free Models (Jan 2025):**
- `meta-llama/llama-3.2-3b-instruct:free` ✨ Recommended
- `google/gemini-flash-1.5` - Very fast
- `mistralai/mistral-7b-instruct:free` - Good quality
- `nousresearch/hermes-3-llama-3.1-405b:free` - High quality

---

**Change the model name and restart - that's all you need!** 🚀
