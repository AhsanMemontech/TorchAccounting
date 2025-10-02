'use client';

import React, { createContext, useContext, useState } from 'react';

interface ChatbotContextType {
  isChatbotOpen: boolean;
  setChatbotOpen: (open: boolean) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider = ({ children }: { children: React.ReactNode }) => {
  const [isChatbotOpen, setChatbotOpen] = useState(false);
  return (
    <ChatbotContext.Provider value={{ isChatbotOpen, setChatbotOpen }}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) throw new Error('useChatbot must be used within a ChatbotProvider');
  return context;
}; 