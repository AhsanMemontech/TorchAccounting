'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { 
  User, 
  Mail, 
  Phone, 
  Home, 
  Edit, 
  ExternalLink, 
  FileText, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard,
  LogOut
} from 'lucide-react'
import { AccessValidator } from '@/lib/accessValidator'
import Link from 'next/link'

interface ContactDetails {
  name: string
  email: string
  phone: string
  address: string
}

export default function PortalPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<ContactDetails>({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/')
          return
        }
        
        setUser(user)
        await fetchUserProfile(user.id)
      } catch (error) {
        console.error('Authentication error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  const fetchUserProfile = async (userId: string) => {
    try {
        console.log(userId)
      const { data: profile, error } = await supabase
        .from('users')
        .select('name, email, phone, address')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) {
        console.error('Error fetching profile:', error)
        return
      }
      
      if (profile) {
        setContactDetails(profile)
        setEditForm({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || ''
        })
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
    }
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
    setUpdateSuccess(false)
    setError(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address
        })
        .eq('id', user.id)
      
      if (error) {
        throw error
      }
      
      setContactDetails(editForm)
      setIsEditing(false)
      setUpdateSuccess(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false)
      }, 3000)
    } catch (error: any) {
      console.error('Update error:', error)
      setError(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDigitsConnect = () => {
    // This is a placeholder for the Digits SSO login
    // Will be implemented later
    alert('Digits SSO integration will be implemented in a future update')
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading your portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <div 
        className={`h-screen fixed top-0 left-0 transition-all duration-300 border-r z-10 flex flex-col`}
        style={{ 
          width: sidebarCollapsed ? '64px' : '240px',
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-primary)'
        }}
      >
        {/* Sidebar Header with User Info */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
              {contactDetails?.name ? contactDetails.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {contactDetails?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {user?.email || ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            <li>
              <button 
                onClick={() => setActiveSection('dashboard')}
                className={`w-full flex items-center p-2 rounded-md transition-colors ${activeSection === 'dashboard' ? 'bg-indigo-100 dark:bg-indigo-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <LayoutDashboard className="h-5 w-5" style={{ color: activeSection === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-tertiary)' }} />
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm" style={{ color: activeSection === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>Dashboard</span>
                )}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('profile')}
                className={`w-full flex items-center p-2 rounded-md transition-colors ${activeSection === 'profile' ? 'bg-indigo-100 dark:bg-indigo-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <User className="h-5 w-5" style={{ color: activeSection === 'profile' ? 'var(--accent-primary)' : 'var(--text-tertiary)' }} />
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm" style={{ color: activeSection === 'profile' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>Profile</span>
                )}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('settings')}
                className={`w-full flex items-center p-2 rounded-md transition-colors ${activeSection === 'settings' ? 'bg-indigo-100 dark:bg-indigo-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Settings className="h-5 w-5" style={{ color: activeSection === 'settings' ? 'var(--accent-primary)' : 'var(--text-tertiary)' }} />
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm" style={{ color: activeSection === 'settings' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>Settings</span>
                )}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('digits')}
                className={`w-full flex items-center p-2 rounded-md transition-colors ${activeSection === 'digits' ? 'bg-indigo-100 dark:bg-indigo-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <ExternalLink className="h-5 w-5" style={{ color: activeSection === 'digits' ? 'var(--accent-primary)' : 'var(--text-tertiary)' }} />
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm" style={{ color: activeSection === 'digits' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>Digits SSO</span>
                )}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('reports')}
                className={`w-full flex items-center p-2 rounded-md transition-colors ${activeSection === 'reports' ? 'bg-indigo-100 dark:bg-indigo-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <BarChart3 className="h-5 w-5" style={{ color: activeSection === 'reports' ? 'var(--accent-primary)' : 'var(--text-tertiary)' }} />
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm" style={{ color: activeSection === 'reports' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>Reports</span>
                )}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveSection('cfo')}
                className={`w-full flex items-center p-2 rounded-md transition-colors ${activeSection === 'cfo' ? 'bg-indigo-100 dark:bg-indigo-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <MessageSquare className="h-5 w-5" style={{ color: activeSection === 'cfo' ? 'var(--accent-primary)' : 'var(--text-tertiary)' }} />
                {!sidebarCollapsed && (
                  <span className="ml-3 text-sm" style={{ color: activeSection === 'cfo' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>CFO Agent</span>
                )}
              </button>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex justify-between items-center">
            <button 
              onClick={handleSignOut}
              className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-300 transition-colors"
            >
              <LogOut className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
              {!sidebarCollapsed && (
                <span className="ml-2 text-sm" style={{ color: 'var(--text-primary)' }}>Sign Out</span>
              )}
            </button>
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-300 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
              ) : (
                <ChevronLeft className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '64px' : '240px' }}
      >
        <div className="p-6 md:p-8 lg:p-10">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div>
              <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                Dashboard
              </h1>
              
              <div className="flex justify-end">
                {/* Digits Integration Card */}
                <div className="rounded-xl border p-6 backdrop-blur-md shadow-lg w-[30%]" 
                  style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Accounting Integration
                  </h2>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 mb-6">
                    <div className="flex justify-center mb-4">
                      <img 
                        src="https://ram.digitscpu.com/_astro-assets/digits-logo.DSsydOMk_ZLWrDw.png" 
                        alt="Digits Logo" 
                        className="h-10"
                      />
                    </div>
                    <p className="text-center text-sm text-gray-700 mb-4">
                      Connect your account to Digits for seamless accounting integration and financial insights
                    </p>
                    <button
                      onClick={handleDigitsConnect}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Connect to Digits</span>
                    </button>
                  </div>
                  
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <p className="mb-2">Benefits of connecting:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Automated bookkeeping</li>
                      <li>Real-time financial insights</li>
                      <li>Expense tracking</li>
                      <li>Tax preparation assistance</li>
                    </ul>
                  </div>
                </div>
                
                {/* Quick Stats Card */}
                {/* <div className="rounded-xl border p-6 backdrop-blur-md shadow-lg" 
                  style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Coming Soon
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <BarChart3 className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Financial Reports</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Access your financial reports and statements</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <MessageSquare className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>CFO Agent</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Chat with your dedicated CFO AI assistant</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <FileText className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Document Management</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Upload and manage your financial documents</p>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div>
              <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                Profile
              </h1>
              
              <div className="rounded-xl border p-6 backdrop-blur-md shadow-lg" 
                style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Contact Details
                  </h2>
                  {!isEditing && (
                    <button 
                      onClick={handleEditToggle}
                      className="flex items-center space-x-1 text-sm py-1 px-3 rounded-md transition-colors"
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)', 
                        color: 'var(--text-secondary)' 
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {updateSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-green-700 text-sm">Contact details updated successfully!</p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {isEditing ? (
                  <form onSubmit={handleSaveChanges}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleInputChange}
                            className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:outline-none"
                            style={{ 
                              backgroundColor: 'var(--bg-input)',
                              borderColor: 'var(--border-primary)',
                              color: 'var(--text-primary)'
                            }}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Email
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleInputChange}
                            className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:outline-none"
                            style={{ 
                              backgroundColor: 'var(--bg-input)',
                              borderColor: 'var(--border-primary)',
                              color: 'var(--text-primary)'
                            }}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Phone
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={editForm.phone}
                            onChange={handleInputChange}
                            className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:outline-none"
                            style={{ 
                              backgroundColor: 'var(--bg-input)',
                              borderColor: 'var(--border-primary)',
                              color: 'var(--text-primary)'
                            }}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Home className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                          </div>
                          <input
                            type="text"
                            name="address"
                            value={editForm.address}
                            onChange={handleInputChange}
                            className="block w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:outline-none"
                            style={{ 
                              backgroundColor: 'var(--bg-input)',
                              borderColor: 'var(--border-primary)',
                              color: 'var(--text-primary)'
                            }}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-2 px-4 rounded-md font-medium transition-colors"
                          style={{ 
                            backgroundColor: 'var(--accent-primary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={handleEditToggle}
                          className="py-2 px-4 rounded-md font-medium transition-colors"
                          style={{ 
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Full Name</p>
                        <p style={{ color: 'var(--text-primary)' }}>{contactDetails?.name || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Email</p>
                        <p style={{ color: 'var(--text-primary)' }}>{contactDetails?.email || user?.email || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Phone className="h-5 w-5 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Phone</p>
                        <p style={{ color: 'var(--text-primary)' }}>{contactDetails?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Home className="h-5 w-5 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Address</p>
                        <p style={{ color: 'var(--text-primary)' }}>{contactDetails?.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div>
              <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                Settings
              </h1>
              <div className="rounded-xl border p-6 backdrop-blur-md shadow-lg" 
                style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Account settings will be available soon.</p>
              </div>
            </div>
          )}

          {/* Digits SSO Section */}
          {activeSection === 'digits' && (
            <div>
              <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                Digits Integration
              </h1>
              <div className="rounded-xl border p-6 backdrop-blur-md shadow-lg" 
                style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 mb-6">
                  <div className="flex justify-center mb-4">
                    <img 
                      src="https://ram.digitscpu.com/_astro-assets/digits-logo.DSsydOMk_ZLWrDw.png" 
                      alt="Digits Logo" 
                      className="h-10"
                    />
                  </div>
                  <p className="text-center text-sm text-gray-700 mb-4">
                    Connect your account to Digits for seamless accounting integration and financial insights
                  </p>
                  <button
                    onClick={handleDigitsConnect}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Connect to Digits</span>
                  </button>
                </div>
                
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <p className="mb-2">Benefits of connecting:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Automated bookkeeping</li>
                    <li>Real-time financial insights</li>
                    <li>Expense tracking</li>
                    <li>Tax preparation assistance</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Reports Section */}
          {activeSection === 'reports' && (
            <div>
              <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                Financial Reports
              </h1>
              <div className="rounded-xl border p-6 backdrop-blur-md shadow-lg" 
                style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                <div className="flex items-center justify-center p-10">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                    <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Coming Soon</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Financial reports will be available after connecting to Digits.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CFO Agent Section */}
          {activeSection === 'cfo' && (
            <div>
              <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                CFO Agent
              </h1>
              <div className="rounded-xl border p-6 backdrop-blur-md shadow-lg" 
                style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
                <div className="flex items-center justify-center p-10">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                    <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Coming Soon</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Your AI CFO assistant will be available soon.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}