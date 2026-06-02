import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { T } from '../translations'

export const useAppStore = create(
  persist(
    (set) => ({
      // ── Language ─────────────────────────────────────────────
      lang: 'he',
      dir: 'rtl',
      t: T.he,
      setLang: (lang) => set({
        lang,
        dir: lang === 'he' ? 'rtl' : 'ltr',
        t: T[lang],
      }),

      // ── Saved phone number ────────────────────────────────────
      savedPhone: '',
      setSavedPhone: (phone) => set({ savedPhone: phone }),
      clearSavedPhone: () => set({ savedPhone: '' }),
    }),
    {
      name: 'iremindme-storage',
      // Persist lang + derived values together so they're always consistent,
      // and savedPhone so it survives browser close/reopen.
      partialize: (state) => ({
        lang: state.lang,
        dir: state.dir,
        t: state.t,
        savedPhone: state.savedPhone,
      }),
    }
  )
)
