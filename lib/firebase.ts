import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    Auth,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendEmailVerification,
    reload,
    User
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;

if (typeof window !== 'undefined') {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
}

export { auth, onAuthStateChanged };
export type { User };

// Auth functions
export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
};

export const signInWithEmail = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Automatically send verification email after signup
    await sendEmailVerification(userCredential.user);
    return userCredential;
};

export const signOut = async () => {
    return firebaseSignOut(auth);
};

// Email verification functions
export const sendVerificationEmail = async (user: User) => {
    if (!user) {
        throw new Error('No user is currently signed in');
    }
    return sendEmailVerification(user);
};

export const checkEmailVerified = async (user: User) => {
    if (!user) {
        return false;
    }
    // Reload user to get latest verification status
    await reload(user);
    return user.emailVerified;
};
