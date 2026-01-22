'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, auth, onAuthStateChanged } from '@/lib/firebase'

interface AuthContextType {
    user: User | null
    loading: boolean
    emailVerified: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    emailVerified: false
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [emailVerified, setEmailVerified] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Reload user to get latest emailVerified status
                try {
                    await firebaseUser.reload();
                } catch (error) {
                    console.error('Error reloading user:', error);
                }
            }

            setUser(firebaseUser)
            setEmailVerified(firebaseUser?.emailVerified || false)

            // Note: We're using IndexedDB for local storage, no need for Supabase sync

            setLoading(false)
        })

        return unsubscribe
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, emailVerified }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
