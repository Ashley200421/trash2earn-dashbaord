import React, { createContext, useContext, useEffect, useState } from 'react'
import { authClient, supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

interface AuthCtx {
  user: User | null
  loading: boolean
  signIn: (email: string, pass: string) => Promise<string | null>
  signOut: () => Promise<void>
}
const Ctx = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage on mount
    authClient.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Keep state in sync when session changes (login/logout/refresh)
    const { data: { subscription } } = authClient.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, pass: string): Promise<string | null> {
    const { data, error } = await authClient.auth.signInWithPassword({ email, password: pass })
    if (error) return error.message

    // Check role in profiles table (not user_metadata)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      await authClient.auth.signOut()
      return 'Access denied. Admin accounts only.'
    }

    return null
  }

  async function signOut() {
    await authClient.auth.signOut()
  }

  return <Ctx.Provider value={{ user, loading, signIn, signOut }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
