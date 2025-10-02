'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { User, Mail, Lock, Phone } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: 'Ahsan',
    email: 'ahsan@thebeacons.org',
    phone: '+923030361643',
    password: 'abcd1234'
  })

  const [loginData, setLoginData] = useState({
    email: 'ahsan@thebeacons.org',
    password: 'abcd1234'
  })

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup')

  // Client-side validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address with @ symbol'
    }

    // Phone validation
    const cleanPhone = formData.phone.replace(/[\s\-\(\)\.+]/g, '')
    const phoneRegex = /^\+?[1-9]\d{9,14}$/
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d+$/.test(cleanPhone.replace(/^\+/, ''))) {
      newErrors.phone = 'Phone number should contain numbers only'
    } else if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      newErrors.phone = 'Phone number must be 10-15 digits'
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if(Object.keys(newErrors).length > 0){
      setError(JSON.stringify(newErrors))
    }
    return Object.keys(newErrors).length === 0
  }
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      const response = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if(response.ok){
        console.log("r: ", await response.json())
      }else{
        console.log("r: ", await response.json())
      }
      
      if (signUpError ) {
        setError(signUpError?.message)
        return
      }
      
      router.push('/payment')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })
      
      if (loginError) {
        setError(loginError.message)
        return
      }
      
      router.push('/payment')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    {activeTab === 'signup' ? (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[600px] flex flex-col lg:flex-row">
          
          {/* Left Section - Login */}
          <div className="relative bg-gradient-to-br from-teal-400 to-emerald-600 p-8 lg:p-12 flex flex-col justify-center items-center text-white min-h-[400px] lg:min-h-full"
            style={{width: '40%'}}>
            {/* Decorative Elements */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white bg-opacity-40 rounded-full"></div>
              </div>
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white bg-opacity-40 rounded-full"></div>
              </div>
            </div>
            
            {/* Abstract diamond shapes */}
            <div className="absolute top-8 right-8 w-3 h-3 bg-white bg-opacity-30 rotate-45"></div>
            <div className="absolute top-20 right-16 w-2 h-2 bg-white bg-opacity-20 rotate-45"></div>
            <div className="absolute bottom-20 left-12 w-4 h-4 bg-white bg-opacity-25 rotate-45"></div>
            
            {/* Large partial circle */}
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-400 rounded-full opacity-80"></div>
            
            <div className="text-center z-10">
              <h1 className="text-2xl lg:text-3xl font-bold mb-4">Welcome Back!</h1>
              <p className="text-lg lg:text-xl mb-8 opacity-90 max-w-xs">
                To keep connected with us please login with your personal info
              </p>
              
              <div className="w-full max-w-xs">
                {error && <div className="text-yellow-200 text-sm mb-4 bg-red-500 bg-opacity-20 p-2 rounded">{error}</div>}
                
                <button
                  type="submit"
                  className="w-full bg-white bg-opacity-20 border-2 border-white text-emerald-700 font-semibold py-3 px-6 rounded-lg hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  onClick={() => setActiveTab('login')}
                >
                  SIGN IN
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Signup */}
          <div className="relative p-8 lg:p-12 flex flex-col justify-center"
            style={{ width:'60%' }}>
            {/* Large partial red geometric shape */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500 rounded-full opacity-60"></div>
            
            <div className="max-w-sm mx-auto w-full">
              <h2 className="text-2xl lg:text-3xl font-bold text-teal-600 mb-6">Create Account</h2>
              
              <form onSubmit={handleSignup} className="space-y-4">
                {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
                
                {/* Name Field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-teal-500 transition-all"
                    placeholder="Name"
                    required
                  />
                </div>
                
                {/* Email Field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-teal-500 transition-all"
                    placeholder="Email"
                    required
                  />
                </div>

                {/* Phone Field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-teal-500 transition-all"
                    placeholder="Phone"
                    required
                  />
                </div>
                
                {/* Password Field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-teal-500 transition-all"
                    placeholder="Password"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'SIGN UP'}
                </button>
              </form>
              
              <div className="text-center mt-6">
                <a onClick={() => setActiveTab('login')} className="text-teal-600 hover:text-teal-700 text-sm hover:underline">
                  Already have an account? Sign in
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[600px] flex flex-col lg:flex-row">
          
          {/* Left Section - Login */}
          <div className="relative bg-gradient-to-br from-teal-400 to-emerald-600 p-8 lg:p-12 flex flex-col justify-center items-center text-white min-h-[400px] lg:min-h-full"
            style={{width: '40%'}}>
            {/* Decorative Elements */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white bg-opacity-40 rounded-full"></div>
              </div>
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white bg-opacity-40 rounded-full"></div>
              </div>
            </div>
            
            {/* Abstract diamond shapes */}
            <div className="absolute top-8 right-8 w-3 h-3 bg-white bg-opacity-30 rotate-45"></div>
            <div className="absolute top-20 right-16 w-2 h-2 bg-white bg-opacity-20 rotate-45"></div>
            <div className="absolute bottom-20 left-12 w-4 h-4 bg-white bg-opacity-25 rotate-45"></div>
            
            {/* Large partial circle */}
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-400 rounded-full opacity-80"></div>
            
            <div className="text-center z-10">
              <h1 className="text-2xl lg:text-3xl font-bold mb-4">Create Account!</h1>
              <p className="text-lg lg:text-xl mb-8 opacity-90 max-w-xs">
                Pleae create an account with your personal info
              </p>
              
              <div className="w-full max-w-xs">
                {error && <div className="text-yellow-200 text-sm mb-4 bg-red-500 bg-opacity-20 p-2 rounded">{error}</div>}
                
                <button
                  type="submit"
                  className="w-full bg-white bg-opacity-20 border-2 border-white text-emerald-700 font-semibold py-3 px-6 rounded-lg hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  onClick={() => setActiveTab('signup')}
                >
                  SIGN UP
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Signup */}
          <div className="relative p-8 lg:p-12 flex flex-col justify-center"
            style={{ width:'60%' }}>
            {/* Large partial red geometric shape */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500 rounded-full opacity-60"></div>
            
            <div className="max-w-sm mx-auto w-full">
              <h2 className="text-2xl lg:text-3xl font-bold text-teal-600 mb-6">Sign In</h2>
              
              <form onSubmit={handleLogin} className="space-y-4">
                {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
                
                {/* Email Field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-teal-500 transition-all"
                    placeholder="Email"
                    required
                  />
                </div>
                
                {/* Password Field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-teal-500 transition-all"
                    placeholder="Password"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'SIGN IN'}
                </button>
              </form>
              
              <div className="text-center mt-6">
                <a onClick={() => setActiveTab('signup')} className="text-teal-600 hover:text-teal-700 text-sm hover:underline">
                  Don&apos;t have an account? Sign up
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>

  )
}