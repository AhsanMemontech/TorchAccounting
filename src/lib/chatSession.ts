import { supabase } from './supabaseClient';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface ChatListItem {
  id: string;
  title: string;
  created_at: string;
  last_message_at: string;
  last_message_preview?: string;
}

const MAX_MESSAGES = 50; // Increased for individual chats

export class ChatSessionManager {
  // Get all chat sessions for a user (for sidebar)
  static async getUserChats(userId: string): Promise<ChatListItem[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at, last_message_at, messages')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching user chats:', error);
        return [];
      }

      return data.map(chat => {
        // Get last message for preview
        const messages = chat.messages || [];
        const lastMessage = messages[messages.length - 1];
        const lastMessagePreview = lastMessage 
          ? (lastMessage.role === 'user' ? 'You: ' : 'AI: ') + 
            (lastMessage.content.length > 50 
              ? lastMessage.content.substring(0, 50) + '...' 
              : lastMessage.content)
          : 'New chat';

        return {
          id: chat.id,
          title: chat.title,
          created_at: chat.created_at,
          last_message_at: chat.last_message_at,
          last_message_preview: lastMessagePreview
        };
      });
    } catch (error) {
      console.error('Error in getUserChats:', error);
      return [];
    }
  }

  // Get specific chat session by ID
  static async getChatSession(chatId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('messages')
        .eq('id', chatId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching chat session:', error);
        return [];
      }

      return data?.messages || [];
    } catch (error) {
      console.error('Error in getChatSession:', error);
      return [];
    }
  }

  // Create new chat session
  static async createNewChat(userId: string, title?: string): Promise<string | null> {
    try {
      const chatTitle = title || `Chat ${new Date().toLocaleDateString()}`;
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          title: chatTitle,
          messages: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating new chat:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createNewChat:', error);
      return null;
    }
  }

  // Add message to specific chat
  static async addMessage(chatId: string, message: ChatMessage): Promise<void> {
    try {
      // Get current messages
      const currentMessages = await this.getChatSession(chatId);
      
      // Add new message
      const updatedMessages = [...currentMessages, message];
      
      // Keep only the last MAX_MESSAGES messages
      const trimmedMessages = updatedMessages.slice(-MAX_MESSAGES);

      const { error } = await supabase
        .from('chat_sessions')
        .update({
          messages: trimmedMessages,
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) {
        console.error('Error adding message:', error);
      }
    } catch (error) {
      console.error('Error in addMessage:', error);
    }
  }

  // Update chat title
  static async updateChatTitle(chatId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) {
        console.error('Error updating chat title:', error);
      }
    } catch (error) {
      console.error('Error in updateChatTitle:', error);
    }
  }

  // Delete chat session
  static async deleteChat(chatId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', chatId);

      if (error) {
        console.error('Error deleting chat:', error);
      }
    } catch (error) {
      console.error('Error in deleteChat:', error);
    }
  }

  // Generate smart title based on first user message
  static async generateChatTitle(firstMessage: string): Promise<string> {
    // Simple title generation - you can enhance this with AI later
    const words = firstMessage.split(' ').slice(0, 6).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  }

  // Legacy method for backward compatibility - gets user's most recent chat
  static async getChatSessionLegacy(userId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('messages')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching chat session:', error);
        return [];
      }

      return data?.messages || [];
    } catch (error) {
      console.error('Error in getChatSessionLegacy:', error);
      return [];
    }
  }

  // Get the most recent chat ID for a user
  static async getLatestChatId(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching latest chat ID:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in getLatestChatId:', error);
      return null;
    }
  }
}