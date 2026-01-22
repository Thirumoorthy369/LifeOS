# Profile Menu System - Logic Documentation

## Overview
The Profile Menu system provides user account management with profile settings navigation and secure logout functionality. This document explains the complete logic flow and implementation details.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Profile Button (Avatar + Name + Chevron)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                         ↓ Click                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Dropdown Menu                                       │   │
│  │  ├─ User Info (Avatar + Email)                      │   │
│  │  ├─ Profile Settings → Navigate to /profile         │   │
│  │  └─ Logout → Sign Out + Redirect to /               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   State Management                           │
│  • isOpen: boolean (dropdown visibility)                    │
│  • menuRef: RefObject (click-outside detection)             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Auth                              │
│  • getIdToken() - Get auth token                            │
│  • signOut() - Logout user                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Router                             │
│  • router.push('/profile') - Navigate to settings           │
│  • router.replace('/') - Redirect after logout              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Logic Flow

### 1. Initialization

```typescript
const [isOpen, setIsOpen] = useState(false);
const menuRef = useRef<HTMLDivElement>(null);
const router = useRouter();
```

**Purpose:**
- `isOpen`: Controls dropdown visibility
- `menuRef`: Reference for click-outside detection
- `router`: Next.js navigation hook

---

### 2. Click-Outside Detection

```typescript
useEffect(() => {
  if (!isOpen) return;
  
  function handleClickOutside(event: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen]);
```

**Logic:**
1. Only runs when dropdown is open (`isOpen = true`)
2. Listens for mousedown events on entire document
3. Checks if click target is outside menu reference
4. Closes menu if clicked outside
5. Cleans up event listener on unmount

**Why mousedown instead of click?**
- Fires before click events
- Prevents conflicts with menu item click handlers
- More reliable for outside-click detection

---

### 3. User Initials Generation

```typescript
const getInitials = () => {
  if (user.displayName) {
    return user.displayName
      .split(' ')           // Split into words
      .map(word => word[0]) // Get first letter of each word
      .join('')             // Combine letters
      .slice(0, 2)          // Take first 2 characters
      .toUpperCase();       // Convert to uppercase
  }
  return user.email?.[0]?.toUpperCase() || 'U';
};
```

**Examples:**
- "John Doe" → "JD"
- "Alice" → "A"
- "hello@email.com" → "H"
- No name/email → "U"

---

### 4. Profile Navigation Logic

```typescript
const goToProfile = () => {
  setIsOpen(false);      // Close dropdown first
  router.push('/profile'); // Navigate to settings page
};
```

**Flow:**
1. User clicks "Profile Settings" button
2. `onClick` handler calls `goToProfile()`
3. Menu closes immediately for instant feedback
4. Router navigates to `/profile` page
5. Profile Settings page loads (defined in `app/profile/page.tsx`)

**Why close menu before navigation?**
- Better UX - immediate visual feedback
- Prevents menu staying open on back navigation
- Cleaner state management

---

### 5. Logout Logic (Critical Flow)

```typescript
const handleLogout = async () => {
  try {
    setIsOpen(false);
    toast.loading('Logging out...');

    await signOut(auth);

    toast.dismiss();
    toast.success('Logged out successfully');

    router.replace('/');
  } catch (err) {
    toast.dismiss();
    toast.error('Logout failed');
    console.error('Logout error:', err);
  }
};
```

**Step-by-Step:**

1. **Close Menu**
   ```typescript
   setIsOpen(false);
   ```
   - Immediate UI feedback

2. **Show Loading State**
   ```typescript
   toast.loading('Logging out...');
   ```
   - User sees progress indicator

3. **Firebase Sign Out**
   ```typescript
   await signOut(auth);
   ```
   - Calls Firebase Auth `signOut()` method
   - Invalidates authentication tokens
   - Triggers `onAuthStateChanged` in AuthProvider
   - Clears user session

4. **Success Feedback**
   ```typescript
   toast.dismiss();
   toast.success('Logged out successfully');
   ```
   - Remove loading toast
   - Show success message

5. **Redirect to Home**
   ```typescript
   router.replace('/');
   ```
   - Navigate to landing page
   - `replace` instead of `push` prevents back-navigation
   - User cannot go back to authenticated pages

6. **Error Handling**
   ```typescript
   catch (err) {
     toast.dismiss();
     toast.error('Logout failed');
     console.error('Logout error:', err);
   }
   ```
   - Catches network errors, Firebase errors
   - Shows error toast
   - Logs error for debugging

**Why router.replace() instead of router.push()?**
- `push()`: Adds to history stack (user can press back)
- `replace()`: Replaces current entry (prevents back navigation)
- Security: Prevents accessing authenticated pages after logout

---

## Authentication Provider Integration

### AuthProvider Context

Located in: `components/providers/auth-provider.tsx`

```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**How Profile Menu Connects:**

1. **Consume Auth Context**
   ```typescript
   const { user } = useAuth();
   ```

2. **Conditional Rendering**
   ```typescript
   if (!user) return null;
   ```
   - Menu only shows when user is authenticated

3. **Reactive Updates**
   - When Firebase auth state changes
   - AuthProvider updates user state
   - Profile Menu re-renders automatically
   - Menu disappears on logout

---

## Profile Settings Page

Located in: `app/profile/page.tsx`

### Features:
1. **Account Information**
   - Display name
   - Email address
   - User ID
   - Email verification status

2. **Notifications**
   - Email notifications toggle
   - Push notifications toggle

3. **Appearance**
   - Theme selection (Dark/Light)
   - Language selection

4. **Data Management**
   - Clear local cache
   - **Delete all user data** (from IndexedDB)
   - Permanent deletion warning

5. **Logout Button**
   - Same logout logic as dropdown
   - Prominent placement for easy access

### Delete All Data Logic

```typescript
const deleteAllUserData = async () => {
  if (!user) return;

  setIsDeleting(true);
  try {
    // Delete from IndexedDB
    await db.tasks.where('owner_id').equals(user.uid).delete();
    await db.expenses.where('owner_id').equals(user.uid).delete();
    await db.habits.where('owner_id').equals(user.uid).delete();
    await db.notes.where('owner_id').equals(user.uid).delete();
    await db.documents.where('owner_id').equals(user.uid).delete();
    
    toast.success('All data deleted successfully!');
    
    // Sign out after deletion
    setTimeout(async () => {
      await signOut(auth);
      router.push('/');
    }, 1000);
  } catch (error) {
    toast.error('Failed to delete data');
  } finally {
    setIsDeleting(false);
  }
};
```

**Safety Measures:**
- Requires confirmation (two-step process)
- Shows warning about permanent deletion
- Automatically logs out after deletion
- Cannot be undone warning

---

## Security Considerations

### 1. Token Management
```typescript
const token = await user.getIdToken();
```
- Firebase automatically refreshes tokens
- Tokens expire after 1 hour
- Automatic renewal on valid session

### 2. Protected Routes
```typescript
if (!user) {
  router.push('/');
}
```
- Redirect unauthenticated users
- Implemented in each protected page
- Middleware configuration in `middleware.ts`

### 3. Server-Side Verification
```typescript
const decodedToken = await adminAuth().verifyIdToken(token);
```
- All API routes verify Firebase tokens
- Server-side validation prevents token forgery
- Used in upload and AI processing endpoints

---

## UI/UX Design Patterns

### 1. Glassmorphism
```css
bg-slate-900/95 backdrop-blur-xl
```
- Semi-transparent background
- Blur effect for depth
- Modern, professional appearance

### 2. Micro-interactions
- Chevron rotation on open/close
- Icon background glow on hover
- Smooth color transitions
- Scale animations

### 3. Visual Hierarchy
- Gradient avatars (high contrast)
- Icon backgrounds (visual grouping)
- Descriptive text under labels
- Clear separation with borders

### 4. Responsive Design
```typescript
<span className="hidden md:block">
  {user.displayName || user.email?.split('@')[0]}
</span>
```
- Hides username on mobile (<768px)
- Shows only avatar on small screens
- Expands on medium+ screens

---

## Toast Notification System

Uses `sonner` library for notifications:

```typescript
import { toast } from 'sonner';
```

### Usage Patterns:

1. **Loading State**
   ```typescript
   toast.loading('Processing...');
   ```

2. **Success**
   ```typescript
   toast.dismiss();
   toast.success('Action completed!');
   ```

3. **Error**
   ```typescript
   toast.error('Something went wrong');
   ```

4. **Info**
   ```typescript
   toast.info('Navigation started');
   ```

**Best Practices:**
- Always dismiss loading toasts before showing result
- Use descriptive messages
- Auto-dismiss after 3-5 seconds
- Don't overlap multiple toasts

---

## Common Issues & Solutions

### Issue 1: Dropdown Not Closing on Navigation
**Problem:** Menu stays open after clicking "Profile Settings"

**Solution:**
```typescript
setIsOpen(false); // Close before navigation
router.push('/profile');
```

### Issue 2: User Can Navigate Back to Protected Pages After Logout
**Problem:** Browser back button shows authenticated pages

**Solution:**
```typescript
router.replace('/'); // Replace instead of push
```

### Issue 3: Click Outside Not Working
**Problem:** Clicking outside doesn't close menu

**Solution:**
```typescript
useEffect(() => {
  if (!isOpen) return; // Only attach listener when open
  // ... event listener code
}, [isOpen]);
```

### Issue 4: Multiple Event Listeners Cause Memory Leak
**Problem:** Event listeners pile up on re-renders

**Solution:**
```typescript
return () => document.removeEventListener('mousedown', handleClickOutside);
```

---

## Testing Checklist

### Functional Testing:
- [ ] Profile button opens dropdown
- [ ] Clicking outside closes dropdown
- [ ] "Profile Settings" navigates to `/profile`
- [ ] "Logout" signs out and redirects to `/`
- [ ] Toast notifications appear correctly
- [ ] Initials generate correctly
- [ ] Menu closes after navigation/logout

### UI Testing:
- [ ] Animations smooth (chevron, hover effects)
- [ ] Responsive on mobile (<768px)
- [ ] Avatar gradients render correctly
- [ ] Text truncates properly
- [ ] Z-index layering correct (menu above content)

### Security Testing:
- [ ] Unauthenticated users see no menu
- [ ] Logout invalidates session
- [ ] Cannot navigate back to protected pages
- [ ] Data deletion requires confirmation

---

## File Structure

```
d:/LifeOS/
├── components/
│   ├── profile-menu.tsx           # Main profile menu component
│   └── providers/
│       └── auth-provider.tsx      # Authentication context
├── app/
│   ├── profile/
│   │   └── page.tsx               # Profile settings page
│   └── dashboard/
│       └── page.tsx               # Uses ProfileMenu
├── lib/
│   ├── firebase.ts                # Firebase configuration
│   └── db.ts                      # IndexedDB (Dexie)
└── middleware.ts                  # Route protection
```

---

## Dependencies

```json
{
  "firebase": "^10.x.x",           // Authentication
  "next": "^16.x.x",                 // Framework & Routing
  "sonner": "^1.x.x",                // Toast notifications
  "lucide-react": "^0.x.x"          // Icons
}
```

---

## Future Enhancements

### Potential Features:
1. **Profile Picture Upload**
   - Replace gradient avatar with custom image
   - Store in IndexedDB or cloud storage

2. **Account Settings**
   - Change display name
   - Update email
   - Change password

3. **Activity Log**
   - Show recent login history
   - Display active sessions
   - Device management

4. **Keyboard Shortcuts**
   - `Esc` to close dropdown
   - `P` to open profile settings
   - `L` to logout

5. **Multi-language Support**
   - Internationalization (i18n)
   - Language selector in profile

---

## Performance Optimizations

### Current Optimizations:
1. **Lazy State Updates**
   ```typescript
   setIsOpen(prev => !prev)
   ```

2. **Conditional Event Listeners**
   ```typescript
   if (!isOpen) return; // Don't attach if closed
   ```

3. **Memoization Opportunities**
   ```typescript
   const initials = useMemo(() => getInitials(), [user]);
   ```

4. **Code Splitting**
   - Profile Settings page loads on-demand
   - Not bundled with main dashboard

---

## Conclusion

The Profile Menu system provides a secure, user-friendly interface for account management with:
- ✅ Clean, maintainable code
- ✅ Proper error handling
- ✅ Security best practices
- ✅ Excellent UX with animations
- ✅ Responsive design
- ✅ Accessible UI patterns

**Last Updated:** 2026-01-22
**Version:** 2.0
**Author:** LifeOS Development Team
