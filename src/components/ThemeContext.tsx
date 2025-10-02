'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  serverTheme,
}: {
  children: React.ReactNode
  serverTheme?: 'light' | 'dark'
}) {
  const isClient = typeof window !== 'undefined'
  // Start with the serverTheme if provided; otherwise fall back to localStorage or 'light'
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    serverTheme
      ? serverTheme
      : isClient && (localStorage.getItem('theme') === 'dark')
      ? 'dark'
      : 'light'
  )

  // Whenever theme changes, write it to the document, localStorage, and cookie
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    if (isClient) {
      localStorage.setItem('theme', theme)
      document.cookie = `theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}`
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook to consume the ThemeContext
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}