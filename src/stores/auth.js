import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        loading: false,
        error: null,
        initialized: false,
    }),

    actions: {
        async init() {
            if (this.initialized) return
            this.loading = true
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession()
                this.user = session?.user ?? null
                supabase.auth.onAuthStateChange((_event, session) => {
                    this.user = session?.user ?? null
                })
            } catch (err) {
                this.error = err.message
            } finally {
                this.loading = false
                this.initialized = true
            }
        },

        async signIn(email, password) {
            this.loading = true
            this.error = null
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                this.user = data.user
                return { success: true }
            } catch (err) {
                this.error = err.message
                return { success: false, error: err.message }
            } finally {
                this.loading = false
            }
        },

        async signOut() {
            await supabase.auth.signOut()
            this.user = null
        },
    },
})
