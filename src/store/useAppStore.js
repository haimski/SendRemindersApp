import { create } from 'zustand'
import { T } from '../translations'

export const useAppStore = create((set) => ({
  lang: 'he',
  dir: 'rtl',
  t: T.he,
  setLang: (lang) => set({
    lang,
    dir: lang === 'he' ? 'rtl' : 'ltr',
    t: T[lang],
  }),
}))
