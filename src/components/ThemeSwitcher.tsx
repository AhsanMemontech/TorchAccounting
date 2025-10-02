'use client'

import { useTheme } from './ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200"
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          borderColor: 'var(--border-secondary)',
          color: 'var(--text-primary)'
        }}
      >
        <Sun className="h-5 w-5 text-yellow-400" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 group"
      style={{ 
        backgroundColor: 'var(--bg-card)', 
        borderColor: 'var(--border-secondary)',
        color: 'var(--text-primary)'
      }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700 group-hover:text-gray-900 transition-colors" />
      )}
    </button>
  )
} 