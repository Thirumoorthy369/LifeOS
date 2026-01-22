import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client that bypasses RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { uid, email, displayName, photoURL, emailVerified } = body

        if (!uid) {
            return NextResponse.json(
                { error: 'Firebase UID is required' },
                { status: 400 }
            )
        }

        // Check if user exists
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('firebase_uid', uid)
            .single()

        if (existingUser) {
            // Update existing user
            const { error } = await supabaseAdmin
                .from('users')
                .update({
                    email,
                    display_name: displayName,
                    photo_url: photoURL,
                    email_verified: emailVerified || false,
                    updated_at: new Date().toISOString()
                })
                .eq('firebase_uid', uid)

            if (error) {
                console.error('Error updating user:', error)
                return NextResponse.json(
                    { error: 'Failed to update user' },
                    { status: 500 }
                )
            }

            return NextResponse.json({ success: true, user: existingUser })
        } else {
            // Create new user
            const { data, error } = await supabaseAdmin
                .from('users')
                .insert({
                    firebase_uid: uid,
                    email,
                    display_name: displayName,
                    photo_url: photoURL,
                    email_verified: emailVerified || false
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating user:', error)
                return NextResponse.json(
                    { error: 'Failed to create user' },
                    { status: 500 }
                )
            }

            return NextResponse.json({ success: true, user: data })
        }
    } catch (error) {
        console.error('Sync error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
