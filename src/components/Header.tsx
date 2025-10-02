'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, User, ChevronDown, Phone } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import ThemeSwitcher from './ThemeSwitcher'

const AVAILABLE_LAWYERS = [
  {
    id: 1,
    name: "Ahsan Memon",
    title: "Divorce & Family Law Attorney",
    calendly: "https://calendly.com/ahsan-thebeacons/30min",
    rating: "4.9",
    experience: "10+ years"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    title: "Family Law Specialist",
    calendly: "https://calendly.com/sarah-johnson-law/consultation",
    rating: "4.8",
    experience: "8+ years"
  },
  {
    id: 3,
    name: "Michael Chen",
    title: "Divorce Attorney",
    calendly: "https://calendly.com/michael-chen-law/30min",
    rating: "4.7",
    experience: "12+ years"
  }
];

export default function Header() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLoginDropdown, setShowLoginDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showLawyerDropdown, setShowLawyerDropdown] = useState(false)
  const [showFloatingLawyerDropdown, setShowFloatingLawyerDropdown] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [hasBasicInfo, setHasBasicInfo] = useState<boolean | null>(null)
  const [showBasicInfoModal, setShowBasicInfoModal] = useState(false)
  
  const loginDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => { listener?.subscription.unsubscribe() }
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check for login dropdown
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(target)) {
        setShowLoginDropdown(false)
      }
      
      // Check for user dropdown
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setShowUserDropdown(false)
      }
      
      // Check for lawyer dropdown - only close if clicking outside the entire lawyer dropdown container
      if (showLawyerDropdown && !target.closest('.lawyer-dropdown') && !target.closest('.mobile-lawyer-dropdown')) {
        setShowLawyerDropdown(false)
      }
      
      // Check for floating lawyer dropdown
      if (showFloatingLawyerDropdown && !target.closest('.floating-lawyer-dropdown')) {
        setShowFloatingLawyerDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLawyerDropdown, showFloatingLawyerDropdown])

  const handleStartDivorce = () => {
    router.push('/information-collection')
    setIsMenuOpen(false)
  }

  const handleHome = () => {
    router.push('/')
    setIsMenuOpen(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setShowUserDropdown(false)
    router.refresh()
  }

  const checkBasicInfo = async (forceRefresh = false): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // First check if profile exists
      const { data: profileExists, error: existsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!profileExists) {
        setHasBasicInfo(false);
        return false;
      }
      
      // Now get the full profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('yourfullname, youremail, yourphone, youraddress, spousefullname, spouselastknownaddress')
        .eq('id', user.id)
        .single();
      
      if (error) {
        setHasBasicInfo(false);
        return false;
      }
      
      const requiredFields = [
        'yourfullname', 'youremail', 'yourphone', 'youraddress',
        'spousefullname', 'spouselastknownaddress'
      ] as const;
      
      const missingFields = requiredFields.filter(field => 
        !profile || !profile[field] || String(profile[field]).trim() === ''
      );
      
      const hasInfo = missingFields.length === 0;
      setHasBasicInfo(hasInfo);
      return hasInfo;
    } catch (error) {
      console.error('Error checking basic info:', error);
      setHasBasicInfo(false);
      return false;
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Account for fixed header height (approximately 80px)
      const headerHeight = 100
      const elementPosition = element.offsetTop - headerHeight
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
    setIsMenuOpen(false)
  }

  const handleHomeClick = () => {
    // If we're not on the home page, navigate there first
    if (window.location.pathname !== '/') {
      router.push('/')
    } else {
      // If we're already on home page, just scroll to hero section
      scrollToSection('hero')
    }
    setIsMenuOpen(false)
  }

  const getInitials = (email: string) => {
    if (!email) return 'U'
    const [name] = email.split('@')
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-40 backdrop-blur-md border-b transition-all duration-300" 
      style={{ 
        backgroundColor: 'var(--bg-overlay)', 
        borderColor: 'var(--border-primary)',
        maxHeight: '77px'
      }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={handleHomeClick}
              className="flex items-center space-x-2 group"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <img src="/Uncouple_ico.png" alt="Uncouple" className="w-6 h-6 sm:w-8 sm:h-8" />
                <div className="ml-1 sm:ml-2 text-lg sm:text-xl font-bold transition-colors" style={{ color: 'var(--text-primary)' }}>
                  <span className="group-hover:text-cyan-400">Uncouple</span>
                  <div className="text-xs hidden sm:block font-normal" style={{ color: 'var(--text-muted)' }}>AI-Powered Divorce</div>
                </div>
              </div>
            </button>
          </div>

          {/* Mobile CTA Buttons - Between Logo and Signin/User Dropdown */}
          <div className="md:hidden ml-auto">
            <button 
              className="flex items-center justify-center text-white px-2 py-1 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--bg-button)', fontSize: '0.6em', marginBottom: '2px' }}
              onClick={() => {
                if (user) {
                  router.push('/information-collection');
                } else {
                  router.push('/login');
                }
              }}
            >
              <svg className="h-2 w-2 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Start Uncontested
            </button>
            <div className="relative">
              <button 
                className="flex items-center justify-center text-white px-2 py-1 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--bg-button)', fontSize: '0.6em' }}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!user) {
                    window.location.href = '/signup';
                  } else {
                    const hasInfo = await checkBasicInfo(true);
                    if (hasInfo) {
                      setShowLawyerDropdown(!showLawyerDropdown);
                    } else {
                      setShowBasicInfoModal(true);
                    }
                  }
                }}
              >
                <Phone className="h-2 w-2 mr-1" /> Speak to a Lawyer
              </button>
              {showLawyerDropdown && (
                <div className="absolute mt-2 w-60 backdrop-blur-md rounded-lg shadow-xl border z-50 mobile-lawyer-dropdown" 
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)', left: '-100px' }}>
                  <div className="p-2 mb-2">
                    <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Available Lawyers</h3>
                    <div className="space-y-3 text-center">
                      {AVAILABLE_LAWYERS.map((lawyer) => (
                        <button
                          key={lawyer.id}
                          className="text-left p-2 rounded-lg border transition-colors touch-manipulation"
                          style={{ borderColor: 'var(--border-secondary)' }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTimeout(() => {
                              const newWindow = window.open(lawyer.calendly, '_blank');
                              if (newWindow) {
                                newWindow.focus();
                              } else {
                                window.location.href = lawyer.calendly;
                              }
                            }, 100);
                            setTimeout(() => {
                              setShowLawyerDropdown(false);
                            }, 200);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{lawyer.name}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.6em' }}>{lawyer.title}</div>
                              <div className="mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.6em' }}>
                                ⭐ {lawyer.rating} • {lawyer.experience} experience
                              </div>
                            </div>
                            <div className="ml-2" style={{ color: 'var(--bg-user-logo)', fontSize: '0.6em' }}>Schedule</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Action Buttons + User/Login */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme Switcher */}
            <div className="hidden md:block">
              <ThemeSwitcher />
            </div>
            {/* User/Login Section */}
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(v => !v)}
                  onMouseEnter={() => setShowUserDropdown(true)}
                  className="flex items-center space-x-2 backdrop-blur-sm border rounded-lg px-2 sm:px-3 py-2 transition-all duration-200 group"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)', color: 'var(--text-primary)' }}
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: 'var(--bg-user-logo)' }}>
                    <span className="text-white font-bold text-xs sm:text-sm">{getInitials(user.email)}</span>
                  </div>
                </button>
                {showUserDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-56 backdrop-blur-md border rounded-xl shadow-2xl z-50 overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
                    onMouseEnter={() => setShowUserDropdown(true)}
                    onMouseLeave={() => setShowUserDropdown(false)}
                  >
                    {/* Header */}
                    <div className="px-4 py-3 border-b bg-gradient-to-r" 
                      style={{ borderColor: 'var(--border-primary)',
                      backgroundColor: 'var(--accent-primary)'
                     }}>
                      <div className="flex items-center space-x-3"
                        >
                        <div className="w-10 h-10 bg-gradient-to-br rounded-full flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: 'var(--bg-user-logo)' }}>
                          <span className="text-white font-bold text-sm">{getInitials(user.email)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>Signed in as</div>
                          <div className="text-xs truncate">{user.email}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1">
                      <a 
                        href="/information-collection" 
                        className="flex items-center px-4 py-2.5 transition-colors text-sm group"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <div className="w-4 h-4 mr-3" style={{ color: 'var(--bg-user-logo)' }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        Profile
                      </a>
                      
                      <a 
                        href="/" 
                        className="flex items-center px-4 py-2.5 hover:bg-white/30 transition-colors text-sm group"
                      >
                        <div className="w-4 h-4 mr-3" style={{ color: 'var(--bg-user-logo)' }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        Home
                      </a>
                      
                      <div className="border-t my-1"></div>
                      
                      <div className='flex'>
                        <button 
                          onClick={handleLogout} 
                          className="flex items-center w-full px-4 py-2.5 transition-colors text-sm group"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <div className="w-4 h-4 mr-3 text-red-400">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          Sign Out
                        </button>

                        <div className="block sm:hidden mr-3 transform scale-75 [&>*]:border-none">
                          <ThemeSwitcher />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" ref={loginDropdownRef}>
                <button
                  onClick={() => setShowLoginDropdown(v => !v)}
                  onMouseEnter={() => setShowLoginDropdown(true)}
                  className="flex items-center space-x-2 transition-colors text-sm font-medium px-2 sm:px-3 py-2 rounded-lg group"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-user-logo)' }}>
                    <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                  </div>
                  <span className="hidden sm:inline">Sign In</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showLoginDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showLoginDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-48 backdrop-blur-md border rounded-xl shadow-2xl z-50 overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
                    onMouseEnter={() => setShowLoginDropdown(true)}
                    onMouseLeave={() => setShowLoginDropdown(false)}
                  >
                    {/* Header */}
                    <div className="px-4 py-3 border-b bg-gradient-to-r" style={{ borderColor: 'var(--border-primary)',
                      backgroundColor: 'var(--accent-primary)'
                     }}>
                      <div className="font-semibold text-xs mb-1" style={{ color: 'var(--text-primary)' }}>Welcome to Uncouple</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sign in to access your account</div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1" style={{ color: 'var(--text-secondary)' }}>
                      <a 
                        href="/login" 
                        className="flex items-center px-4 py-2.5 hover:bg-white/30 transition-colors text-sm group"
                      >
                        <div className="w-4 h-4 mr-3" style={{ color: 'var(--bg-user-logo)' }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        Log In
                      </a>
                      
                      <a 
                        href="/signup" 
                        className="flex items-center px-4 py-2.5 hover:bg-white/30 transition-colors text-sm group"
                      >
                        <div className="w-4 h-4 mr-3" style={{ color: 'var(--bg-user-logo)' }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        Create Account
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Basic Info Modal */}
      {showBasicInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full text-center" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Complete Basic Information</h3>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>To schedule a call with a lawyer, you need to complete all basic information including:</p>
            <ul className="text-sm mb-6 text-left space-y-1" style={{ color: 'var(--text-tertiary)' }}>
              <li>• Your full name and contact details</li>
              <li>• Your address</li>
              <li>• Spouse&apos;s full name and address</li>
            </ul>
            <button
              className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white px-6 py-2 rounded-lg font-semibold transition-colors w-full mb-2"
              onClick={() => {
                setShowBasicInfoModal(false);
                router.push('/information-collection');
              }}
            >
              Complete Information
            </button>
            <button
              className="text-sm mt-2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setShowBasicInfoModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </header>
    
        {/* Floating Action Buttons - Desktop Only */}
        <div className="hidden lg:flex flex-col space-y-3 fixed z-50" style={{ right: '0.5rem', bottom: '3.0rem' }}>
          {/* Speak to a Lawyer Button with Dropdown */}
          <div className="relative floating-lawyer-dropdown">
            <button 
              className="flex items-center gap-2 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg transition-colors" 
              style={{ backgroundColor: 'var(--bg-button)' }} 
              onClick={async () => {
                if (!user) {
                  window.location.href = '/signup';
                } else {
                  const hasInfo = await checkBasicInfo(true);
                  if (hasInfo) {
                    setShowFloatingLawyerDropdown(!showFloatingLawyerDropdown);
                  } else {
                    setShowBasicInfoModal(true);
                  }
                }
              }}
          >
          <Phone className="h-4 w-4" />
          Speak to a Lawyer
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showFloatingLawyerDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Lawyer Dropdown */}
        {showFloatingLawyerDropdown && (
          <div className="absolute bottom-full right-0 mb-3 w-80 backdrop-blur-md border rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Available Lawyers</h3>
                <button 
                  onClick={() => setShowFloatingLawyerDropdown(false)}
                  className="transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {AVAILABLE_LAWYERS.map((lawyer) => (
                  <button
                    key={lawyer.id}
                    className="w-full text-left p-3 rounded-lg border transition-colors"
                    style={{ borderColor: 'var(--border-secondary)' }}
                    onClick={() => {
                      window.open(lawyer.calendly, '_blank');
                      setShowFloatingLawyerDropdown(false);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{lawyer.name}</div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{lawyer.title}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          ⭐ {lawyer.rating} • {lawyer.experience} experience
                        </div>
                      </div>
                      <div className="text-xs font-medium" style={{ color: 'var(--bg-user-logo)' }}>Schedule</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Uncontested Divorce Button */}
      <button 
        className="flex items-center gap-1 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg transition-colors" 
        style={{ backgroundColor: 'var(--bg-button)' }} 
        onClick={() => {
          if (user) {
            router.push('/information-collection');
          } else {
            router.push('/login');
          }
        }}
      >
        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Start Uncontested Divorce
      </button>      
    </div>
  </>
  )
} 