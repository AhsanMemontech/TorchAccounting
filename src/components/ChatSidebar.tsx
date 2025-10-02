'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Plus, MessageCircle, Trash2, Edit2, Check, MoreVertical } from 'lucide-react'
import { ChatSessionManager, ChatListItem } from '@/lib/chatSession'
import { supabase } from '@/lib/supabaseClient'

interface ChatSidebarProps {
  isOpen: boolean
  onChatSelect: (chatId: string) => void
  currentChatId?: string
  position?: 'left' | 'right'
  width?: string
  onCollapseChange?: (isCollapsed: boolean) => void
  onNewChatWelcome?: () => void
  refreshTrigger?: number
}

export default function ChatSidebar({ 
  isOpen,
  onChatSelect,
  currentChatId,
  position = 'left',
  width = 'w-80',
  onCollapseChange,
  onNewChatWelcome,
  refreshTrigger
}: ChatSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [chats, setChats] = useState<ChatListItem[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showOptionsFor, setShowOptionsFor] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => { listener?.subscription.unsubscribe() }
  }, [])

  // Load chats when user changes
  useEffect(() => {
    if (user) {
      loadChats()
    }
  }, [user])

  // Notify parent when collapse state changes
  useEffect(() => {
    onCollapseChange?.(isCollapsed)
  }, [isCollapsed, onCollapseChange])

  const loadChats = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const userChats = await ChatSessionManager.getUserChats(user.id)
      setChats(userChats)
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add this useEffect to reload chats when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadChats();
    }
  }, [refreshTrigger]);

  const handleNewChat = async () => {
    if (!user) return
    
    // Show welcome view instead of creating a new chat immediately
    if (onNewChatWelcome) {
      onNewChatWelcome()
    }
    
    // try {
    //   const newChatId = await ChatSessionManager.createNewChat(user.id)
    //   if (newChatId) {
    //     await loadChats() // Refresh the chat list
    //     onChatSelect(newChatId)
    //   }
    // } catch (error) {
    //   console.error('Error creating new chat:', error)
    // }
  }

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (confirm('Are you sure you want to delete this chat?')) {
      try {
        await ChatSessionManager.deleteChat(chatId)
        await loadChats() // Refresh the chat list
        
        // If we deleted the current chat, we might want to select another one
        if (currentChatId === chatId && chats.length > 1) {
          const remainingChats = chats.filter(chat => chat.id !== chatId)
          if (remainingChats.length > 0) {
            onChatSelect(remainingChats[0].id)
          }
        }
      } catch (error) {
        console.error('Error deleting chat:', error)
      }
    }
    setShowOptionsFor(null)
  }

  const handleEditTitle = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingChatId(chatId)
    setEditTitle(currentTitle)
    setShowOptionsFor(null)
  }

  const handleSaveTitle = async (chatId: string) => {
    if (editTitle.trim()) {
      try {
        await ChatSessionManager.updateChatTitle(chatId, editTitle.trim())
        await loadChats() // Refresh the chat list
      } catch (error) {
        console.error('Error updating chat title:', error)
      }
    }
    setEditingChatId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingChatId(null)
    setEditTitle('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const sidebarClasses = `
  sidebar border-desktop
  fixed ${position === 'left' ? 'left-0' : 'right-0'} h-full z-50
  ${isCollapsed ? 'w-16' : width}
  transform transition-all duration-300 ease-in-out
  ${isOpen ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full'}
  ${isCollapsed ? 'bg-transparent no-border' : 'bg-[var(--bg-secondary)]'}
  ${!isCollapsed ? 'backdrop-blur-md' : ''}
  md:bg-[var(--bg-secondary)]
  md:backdrop-blur-md
`;
  
  return (
    <>
      {/* Sidebar */}
      <div 
        className={sidebarClasses}
        style={{ 
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:border-b" style={{ borderColor: 'var(--border-primary)' }}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Chat History
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            {/* Collapse/Expand button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-md transition-colors hover:bg-opacity-20"
              style={{ 
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        {!isCollapsed && user && (
          <div className="p-4 md:border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors hover:bg-opacity-10"
              style={{ 
                borderColor: 'var(--border-secondary)',
                color: 'var(--text-secondary)'
              }}
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {!user ? (
            // Registration prompt for non-logged-in users
            <div className="p-4">
              {!isCollapsed && (
                <div className="text-center space-y-4">
                  <div className="mb-4">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--bg-user-logo)' }} />
                    <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                      Save Your Questions & Answers
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      To have this feature, you need to register. Sign up to store all your questions and have them available anytime.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => window.location.href = '/signup'}
                      className="w-full text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                      style={{ backgroundColor: 'var(--bg-user-logo)' }}
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="w-full border border-gray-600 hover:bg-gray-200 text-gray-300 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                      style={{ 
                        borderColor: 'var(--border-secondary)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Log In
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
              {!isCollapsed && "No chats yet. Start a new conversation!"}
            </div>
          ) : (
            <div className="p-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`
                    md:block relative group mb-2 p-3 rounded-lg cursor-pointer transition-colors
                    ${currentChatId === chat.id ? 'bg-opacity-20' : 'hover:bg-opacity-10'}
                    ${isCollapsed ? 'flex justify-center hidden' : ''}
                  `}
                  style={{ 
                    backgroundColor: currentChatId === chat.id ? 'var(--accent-primary)' : 'transparent'
                  }}
                  onClick={() => onChatSelect(chat.id)}
                  title={isCollapsed ? chat.title : undefined}
                >
                  {isCollapsed ? (
                    <MessageCircle className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {editingChatId === chat.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm rounded border"
                                style={{ 
                                  backgroundColor: 'var(--bg-primary)',
                                  borderColor: 'var(--border-primary)',
                                  color: 'var(--text-primary)'
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveTitle(chat.id)
                                  if (e.key === 'Escape') handleCancelEdit()
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveTitle(chat.id)}
                                className="p-1 rounded hover:bg-opacity-20"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                {chat.title}
                              </h3>
                              <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                                {chat.last_message_preview}
                              </p>
                              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                {formatDate(chat.last_message_at)}
                              </p>
                            </>
                          )}
                        </div>
                        
                        {editingChatId !== chat.id && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowOptionsFor(showOptionsFor === chat.id ? null : chat.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-opacity-20 transition-opacity"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              <MoreVertical className="w-3 h-3" />
                            </button>
                            
                            {showOptionsFor === chat.id && (
                              <div 
                                className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border py-1 z-10"
                                style={{ 
                                  backgroundColor: 'var(--bg-primary)',
                                  borderColor: 'var(--border-primary)'
                                }}
                              >
                                <button
                                  onClick={(e) => handleEditTitle(chat.id, chat.title, e)}
                                  className="w-full px-3 py-2 text-left text-xs hover:bg-opacity-10 flex items-center space-x-2"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  onClick={(e) => handleDeleteChat(chat.id, e)}
                                  className="w-full px-3 py-2 text-left text-xs hover:bg-opacity-10 flex items-center space-x-2 text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:border-t" style={{ borderColor: 'var(--border-primary)' }}>
          {user && !isCollapsed && (
            <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              {chats.length} chat{chats.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </>
  )
}