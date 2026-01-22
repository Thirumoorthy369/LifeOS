'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

interface ProfileMenuProps {
  user: {
    email: string | null;
    displayName?: string | null;
  } | null;
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* ------------------ close on outside click ------------------ */
  useEffect(() => {
    if (!isOpen) return;

    const handler = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (!user) return null;

  const initials =
    user.displayName?.[0]?.toUpperCase() ??
    user.email?.[0]?.toUpperCase() ??
    'U';

  /* ------------------ actions ------------------ */

  const openProfile = () => {
    setIsOpen(false);
    router.push('/profile');
  };

  const logout = async () => {
    try {
      setIsOpen(false);
      toast.loading('Logging out...');

      await signOut(auth);

      toast.dismiss();
      toast.success('Logged out');

      router.replace('/');
    } catch (err) {
      toast.dismiss();
      toast.error('Logout failed');
    }
  };

  return (
    <div ref={menuRef} className="relative">

      {/* PROFILE BUTTON */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-slate-800/50 border border-slate-700
          hover:bg-slate-800 hover:border-slate-600
          transition cursor-pointer
        "
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold">
          {initials}
        </div>

        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* DROPDOWN */}
      {isOpen && (
        <>
          {/* BACKDROP */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="
              absolute right-0 mt-2 w-64 z-50
              bg-slate-900 border border-slate-700
              rounded-xl shadow-xl overflow-hidden
            "
          >
            {/* USER INFO */}
            <div className="p-4 border-b border-slate-700 bg-slate-800/60">
              <p className="text-white font-semibold">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user.email}
              </p>
            </div>

            {/* BUTTONS */}
            <div className="py-2">

              {/* PROFILE */}
              <button
                onClick={openProfile}
                className="
                  w-full flex items-center gap-3 px-4 py-3
                  text-left cursor-pointer
                  hover:bg-slate-800
                  transition group
                "
              >
                <Settings className="w-4 h-4 text-blue-400 group-hover:rotate-90 transition" />
                <span className="text-slate-200">
                  Profile Settings
                </span>
              </button>

              {/* LOGOUT */}
              <button
                onClick={logout}
                className="
                  w-full flex items-center gap-3 px-4 py-3
                  text-left cursor-pointer
                  hover:bg-red-500/10
                  transition group
                "
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-red-400">
                  Logout
                </span>
              </button>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
