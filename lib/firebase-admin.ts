import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'

let adminApp: App | undefined
let adminAuth: Auth | undefined

/**
 * Initialize Firebase Admin SDK for server-side operations
 * Used for token verification and administrative auth operations
 */
function initializeFirebaseAdmin(): { app: App; auth: Auth } {
    // Return existing instance if already initialized
    if (adminApp && adminAuth) {
        return { app: adminApp, auth: adminAuth }
    }

    try {
        // Check if already initialized by getApps
        const apps = getApps()
        if (apps.length > 0) {
            adminApp = apps[0]
            adminAuth = getAuth(adminApp)
            return { app: adminApp, auth: adminAuth }
        }

        // Get credentials from environment variables
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

        if (!privateKey || !clientEmail || !projectId) {
            throw new Error(
                'Missing Firebase Admin credentials. Please check your .env file for ' +
                'FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL, and NEXT_PUBLIC_FIREBASE_PROJECT_ID'
            )
        }

        // Replace escaped newlines in private key (from .env)
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n')

        // Initialize with service account credentials
        adminApp = initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey: formattedPrivateKey
            })
        })

        adminAuth = getAuth(adminApp)

        console.log('Firebase Admin SDK initialized successfully')
        return { app: adminApp, auth: adminAuth }
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error)
        throw error
    }
}

// Getter function for adminAuth with lazy initialization
function getAdminAuth(): Auth {
    const { auth } = initializeFirebaseAdmin()
    return auth
}

export { getAdminAuth as adminAuth }
