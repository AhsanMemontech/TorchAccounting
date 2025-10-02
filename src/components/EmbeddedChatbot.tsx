'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Mic, Phone, ChevronDown, Loader2, ChevronUp, History } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ChatSessionManager, ChatMessage } from '@/lib/chatSession';

const SUGGESTIONS = [
  "What if my ex won't let me see my kids?",
  "How do I file for divorce in NY?",
  "Can I get spousal support?",
  "What's the difference between legal separation and divorce?"
];

const ONBOARDING_QUESTIONS = [
  {
    id: 'situation',
    question: "What's your current situation?",
    type: 'multiple_choice',
    options: [
      "I'm thinking about divorce",
      "I've decided to get divorced",
      "My spouse filed for divorce",
      "We're already separated"
    ]
  },
  {
    id: 'children',
    question: "Do you have children together?",
    type: 'multiple_choice',
    options: [
      "Yes, under 18",
      "Yes, all over 18",
      "No children together"
    ]
  },
  {
    id: 'assets',
    question: "Do you own property or have significant assets together?",
    type: 'multiple_choice',
    options: [
      "Yes, we own a home",
      "Yes, other significant assets",
      "No significant shared assets"
    ]
  },
  {
    id: 'state',
    question: "Thanks for sharing that. Just so we can give you the right help — which state are you in?",
    type: 'open'
  }
];

interface EmbeddedChatbotProps {
  sidebarCollapsed?: boolean;
  userLoggedIn?: boolean;
  selectedChatId?: string;
  showWelcomeOnLogin?: boolean;
  onWelcomeDismissed?: () => void;
  onChatSelect?: (chatId: string) => void;
  onChatCreated?: () => void;
}

export default function EmbeddedChatbot({ 
  sidebarCollapsed = false, 
  userLoggedIn = false, 
  selectedChatId,
  showWelcomeOnLogin = false,
  onWelcomeDismissed,
  onChatSelect,
  onChatCreated
}: EmbeddedChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showOlderMessages, setShowOlderMessages] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const MAX_FREE_QUESTIONS = 3;
  const [questionCount, setQuestionCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [showBasicInfoModal, setShowBasicInfoModal] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(selectedChatId);
  let chatIdRef = useRef<string | undefined>(selectedChatId);

  const [hasBasicInfo, setHasBasicInfo] = useState<boolean | null>(null);
  const [currentFollowUpQuestions, setCurrentFollowUpQuestions] = useState<string[]>([]);
  
  // Welcome and onboarding flow state
  const [showWelcome, setShowWelcome] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingResponses, setOnboardingResponses] = useState<{[key: string]: string}>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");
  
  // Get current question for onboarding
  const currentQuestion = ONBOARDING_QUESTIONS[onboardingStep];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // Reset basic info cache when user changes
  useEffect(() => {
    setHasBasicInfo(null);
  }, [user?.id]);

  // Clear chat history when user logs out
  useEffect(() => {
    if (!user && messages.length > 0) {
      resetToWelcome();
    }
  }, [user]);



  // Handle welcome view on login - this should take priority
  useEffect(() => {
    if (user && showWelcomeOnLogin) {
      setShowWelcome(true);
      setMessages([]);
      setOnboardingComplete(true);
      setCurrentChatId(undefined);
    }
  }, [user, showWelcomeOnLogin]);

  const [justCreatedNewChat, setJustCreatedNewChat] = useState(false); // Add this flag

  // Load specific chat when selectedChatId changes (for refresh or chat selection)
  // Only load if NOT showing welcome on login AND we didn't just create a new chat
  useEffect(() => {
    if (user && selectedChatId && !showWelcomeOnLogin && !justCreatedNewChat) {
      setCurrentChatId(selectedChatId);
      loadSpecificChat(selectedChatId);
    }
    // Reset the flag after processing
    if (justCreatedNewChat) {
      setJustCreatedNewChat(false);
    }
  }, [selectedChatId, user, showWelcomeOnLogin, justCreatedNewChat]);

  // Start welcome screen for non-logged-in users
  useEffect(() => {
    if (!user && messages.length === 0) {
      setShowWelcome(true);
      setMessages([]);
      setOnboardingComplete(true); // Allow immediate typing
    }
  }, [user, messages.length]);

  const resetToWelcome = () => {
    setMessages([]);
    setShowWelcome(true);
    setOnboardingStep(0);
    setOnboardingComplete(false);
    setOnboardingResponses({});
    setQuestionCount(0);
    setLocked(false);
    setShowOlderMessages(false);
    setIsTyping(false);
    setCurrentFollowUpQuestions([]);
  };

  // Function to get dynamic input area classes based on sidebar state
  const getInputAreaClasses = () => {
    const baseClasses = "fixed bottom-0 right-0 transition-all duration-300";
    // Adjust left positioning based on sidebar state
    const leftClass = sidebarCollapsed ? "left-16" : "left-80";
    return `${baseClasses} ${leftClass}`;
  };

  const loadChatHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const history = await ChatSessionManager.getChatSession(user.id);
      if (history.length > 0) {
        setMessages(history);
        // Check if onboarding was completed in previous session
        const hasOnboardingComplete = history.some(msg => 
          msg.content.includes("Thanks for sharing that") || 
          msg.content.includes("which state are you in")
        );
        setOnboardingComplete(hasOnboardingComplete);
        setShowWelcome(false); // Ensure welcome screen is hidden for logged-in users
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Fallback to direct welcome for logged-in users
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: "Hi, I'm Uncouple AI assistant. I can help you understand your divorce rights in NY. What's on your mind?",
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
      setOnboardingComplete(true);
      setShowWelcome(false); // Ensure welcome screen is hidden for logged-in users
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const startOnboarding = () => {
    // Prevent logged-in users from starting onboarding
    if (user) {
      setShowWelcome(false);
      setOnboardingComplete(true);
      const directMessage: ChatMessage = {
        role: 'assistant',
        content: "Hi, I'm here to help with your divorce questions. What would you like to know?",
        timestamp: new Date().toISOString()
      };
      setMessages([directMessage]);
      return;
    }
    
    // Show welcome message instead of immediately showing the MCQ question
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: "Hi! I'm here to help you with your divorce questions. Let's start by understanding your situation better.",
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    setShowWelcome(false);
    setOnboardingStep(0);
    setOnboardingComplete(false);
  };

  const handleWelcomeOption = (optionId: string) => {
    if (optionId === 'start_onboarding') {
      startOnboarding();
    } else if (optionId === 'ask_directly') {
      setShowWelcome(false);
      setOnboardingComplete(true);
      const directMessage: ChatMessage = {
        role: 'assistant',
        content: "Hi, I'm here to help with your divorce questions. What would you like to know?",
        timestamp: new Date().toISOString()
      };
      setMessages([directMessage]);
    }
    
    // Dismiss welcome view when user interacts with it
    if (onWelcomeDismissed) {
      onWelcomeDismissed();
    }
  };

  const handleOnboardingResponse = async (response: string) => {
    
    // Save user response
    const userMessage: ChatMessage = {
      role: 'user',
      content: response,
      timestamp: new Date().toISOString()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    
    // Save response to onboarding state
    setOnboardingResponses(prev => ({
      ...prev,
      [currentQuestion.id]: response
    }));
    
    // Save to session if user is logged in
    if (user) {
      await saveMessageToSession(userMessage);
    }
    
    // Handle "I've already started the process" response
    if (currentQuestion.id === 'situation' && response.toLowerCase().includes('already started')) {
      setIsTyping(true);
      
      // Use AI to generate login prompt
      try {
        const loginResponse = await fetch('/api/chat-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `The user selected "I've already started the process" during onboarding. Please provide a warm, professional message explaining they need to log in to continue their divorce process. Make it encouraging and helpful.`,
            userId: user?.id || null,
            conversationHistory: messages,
          }),
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          
          setTimeout(() => {
            const loginMessage: ChatMessage = {
              role: 'assistant',
              content: loginData.response,
              timestamp: new Date().toISOString()
            };
            setMessages(msgs => [...msgs, loginMessage]);
            setOnboardingComplete(true);
            setShowLoginPrompt(true);
            setIsTyping(false);
            
            // Save bot message to session
            if (user) {
              saveMessageToSession(loginMessage);
            }
          }, 1000);
        } else {
          // Fallback to hardcoded message
          setTimeout(() => {
            const loginMessage: ChatMessage = {
              role: 'assistant',
              content: "Since you've already started the process, you'll need to log in to access your account and continue where you left off. Would you like to log in now?",
              timestamp: new Date().toISOString()
            };
            setMessages(msgs => [...msgs, loginMessage]);
            setOnboardingComplete(true);
            setShowLoginPrompt(true);
            setIsTyping(false);
            
            if (user) {
              saveMessageToSession(loginMessage);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error generating login message:', error);
        // Fallback to hardcoded message
        setTimeout(() => {
          const loginMessage: ChatMessage = {
            role: 'assistant',
            content: "Since you've already started the process, you'll need to log in to access your account and continue where you left off. Would you like to log in now?",
            timestamp: new Date().toISOString()
          };
          setMessages(msgs => [...msgs, loginMessage]);
          setOnboardingComplete(true);
          setShowLoginPrompt(true);
          setIsTyping(false);
          
          if (user) {
            saveMessageToSession(loginMessage);
          }
        }, 1000);
      }
      
      return;
    }
    
    // Handle state response specifically
    if (currentQuestion.id === 'state') {
      setIsTyping(true);
      
      // Use AI to determine if the user is in New York
      try {
        const stateCheckResponse = await fetch('/api/chat-onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `The user was asked "which state are you in?" and they responded: "${response}". 

If they mentioned New York (including variations like "New York", "NY", "New York State", "NYC", "new york", etc.), respond with "NY".

If they mentioned any other actual US state, respond with the state name they mentioned.

If they didn't mention a state (like saying "yes", "no", "maybe", etc.), ask them to clarify by responding with "CLARIFY".

Just respond with "NY", "OTHER", or "CLARIFY" - nothing else.`,
            userId: user?.id || null,
            conversationHistory: messages,
          }),
        });

        if (stateCheckResponse.ok) {
          const stateData = await stateCheckResponse.json();
          const aiResponse = stateData.response.toLowerCase().trim();
          const isNewYork = aiResponse.includes('ny');
          const needsClarification = aiResponse.includes('clarify');
          
          setTimeout(async () => {
            let completionMessage: ChatMessage;
            
            if (needsClarification) {
              // Use AI to generate clarification message
              try {
                const clarifyResponse = await fetch('/api/chat-onboarding', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: `The user didn't provide a clear state when asked "which state are you in?". Please provide a polite message asking them to clarify their state with examples.`,
                    userId: user?.id || null,
                    conversationHistory: messages,
                  }),
                });

                if (clarifyResponse.ok) {
                  const clarifyData = await clarifyResponse.json();
                  completionMessage = {
                    role: 'assistant',
                    content: clarifyData.response,
                    timestamp: new Date().toISOString()
                  };
                } else {
                  // Fallback
                  completionMessage = {
                    role: 'assistant',
                    content: "I need to know which state you're in to help you properly. Could you please tell me your state? (For example: New York, California, Texas, etc.)",
                    timestamp: new Date().toISOString()
                  };
                }
              } catch (error) {
                console.error('Error generating clarification message:', error);
                completionMessage = {
                  role: 'assistant',
                  content: "I need to know which state you're in to help you properly. Could you please tell me your state? (For example: New York, California, Texas, etc.)",
                  timestamp: new Date().toISOString()
                };
              }
              setOnboardingComplete(false); // Don't complete onboarding yet
            } else if (isNewYork) {
              // Use AI to generate NY completion message
              try {
                const nyResponse = await fetch('/api/chat', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: `The user confirmed they are in New York. Please provide a warm, encouraging message welcoming them to ask questions about their divorce rights in New York.`,
                    userId: user?.id || null,
                    conversationHistory: messages,
                  }),
                });

                if (nyResponse.ok) {
                  const nyData = await nyResponse.json();
                  completionMessage = {
                    role: 'assistant',
                    content: nyData.response,
                    timestamp: new Date().toISOString()
                  };
                  
                  // Store follow-up questions if available
                  if (nyData.followUpQuestions && nyData.followUpQuestions.length > 0) {
                    setCurrentFollowUpQuestions(nyData.followUpQuestions);
                  }
                } else {
                  // Fallback
                  completionMessage = {
                    role: 'assistant',
                    content: "Perfect! Now I can help you with specific questions about your divorce rights in New York. What would you like to know?",
                    timestamp: new Date().toISOString()
                  };
                }
              } catch (error) {
                console.error('Error generating NY completion message:', error);
                completionMessage = {
                  role: 'assistant',
                  content: "Perfect! Now I can help you with specific questions about your divorce rights in New York. What would you like to know?",
                  timestamp: new Date().toISOString()
                };
              }
              setOnboardingComplete(true);
            } else {
              // Use AI to generate non-NY completion message
              try {
                const otherResponse = await fetch('/api/chat-onboarding', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: `The user is not in New York. Please provide a message informing them that your state goes live in 2 days and you'll notify them when it's ready.`,
                    userId: user?.id || null,
                    conversationHistory: messages,
                  }),
                });

                if (otherResponse.ok) {
                  const otherData = await otherResponse.json();
                  completionMessage = {
                    role: 'assistant',
                    content: otherData.response,
                    timestamp: new Date().toISOString()
                  };
                } else {
                  // Fallback
                  completionMessage = {
                    role: 'assistant',
                    content: "your state goes live in 2 days – we'll notify you as soon as it's ready.",
                    timestamp: new Date().toISOString()
                  };
                }
              } catch (error) {
                console.error('Error generating non-NY completion message:', error);
                completionMessage = {
                  role: 'assistant',
                  content: "your state goes live in 2 days – we'll notify you as soon as it's ready.",
                  timestamp: new Date().toISOString()
                };
              }
              setOnboardingComplete(true);
            }
            
            setMessages(msgs => [...msgs, completionMessage]);
            setIsTyping(false);
            
            // Save completion message to session
            if (user) {
              saveMessageToSession(completionMessage);
            }
          }, 1000);
        } else {
          // Fallback to simple text matching if AI fails
          const userState = response.toLowerCase().trim();
          const isNewYork = userState.includes('new york') || userState.includes('ny') || userState.includes('new york state');
          
          setTimeout(() => {
            let completionMessage: ChatMessage;
            
            if (isNewYork) {
              completionMessage = {
                role: 'assistant',
                content: "Perfect! Now I can help you with specific questions about your divorce rights in New York. What would you like to know?",
                timestamp: new Date().toISOString()
              };
            } else {
              completionMessage = {
                role: 'assistant',
                content: "your state goes live in 2 days – we'll notify you as soon as it's ready.",
                timestamp: new Date().toISOString()
              };
            }
            
            setMessages(msgs => [...msgs, completionMessage]);
            setOnboardingComplete(true);
            setIsTyping(false);
            
            if (user) {
              saveMessageToSession(completionMessage);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking state with AI:', error);
        // Fallback to simple text matching
        const userState = response.toLowerCase().trim();
        const isNewYork = userState.includes('new york') || userState.includes('ny') || userState.includes('new york state');
        
        setTimeout(() => {
          let completionMessage: ChatMessage;
          
          if (isNewYork) {
            completionMessage = {
              role: 'assistant',
              content: "Perfect! Now I can help you with specific questions about your divorce rights in New York. What would you like to know?",
              timestamp: new Date().toISOString()
            };
          } else {
            completionMessage = {
              role: 'assistant',
              content: "your state goes live in 2 days – we'll notify you as soon as it's ready.",
              timestamp: new Date().toISOString()
            };
          }
          
          setMessages(msgs => [...msgs, completionMessage]);
          setOnboardingComplete(true);
          setIsTyping(false);
          
          if (user) {
            saveMessageToSession(completionMessage);
          }
        }, 1000);
      }
      
      return;
    }
    
    // Move to next question or complete onboarding
    const nextStep = onboardingStep + 1;
    if (nextStep < ONBOARDING_QUESTIONS.length) {
      setIsTyping(true);
      
      // Use the exact next question from our predefined list
      const nextQuestion = ONBOARDING_QUESTIONS[nextStep];
      
      setTimeout(() => {
        const botMessage: ChatMessage = {
          role: 'assistant',
          content: nextQuestion.question,
          timestamp: new Date().toISOString()
        };
        setMessages(msgs => [...msgs, botMessage]);
        setOnboardingStep(nextStep);
        setIsTyping(false);
        
        // Save bot message to session
        if (user) {
          saveMessageToSession(botMessage);
        }
      }, 1000);
    } else {
      // Onboarding complete - use AI for completion message
      setIsTyping(true);
      
      const aiCompletionResponse = await generateOnboardingCompletion(response, onboardingResponses);
      
      setTimeout(() => {
        const completionMessage: ChatMessage = {
          role: 'assistant',
          content: aiCompletionResponse,
          timestamp: new Date().toISOString()
        };
        setMessages(msgs => [...msgs, completionMessage]);
        setOnboardingComplete(true);
        setIsTyping(false);
        
        // Save completion message to session
        if (user) {
          saveMessageToSession(completionMessage);
        }
      }, 1000);
    }
  };

  const handleMultipleChoiceResponse = (option: string) => {
    handleOnboardingResponse(option);
  };

  const handleFollowUpQuestion = async (question: string) => {
    // Clear follow-up questions immediately
    setCurrentFollowUpQuestions([]);
    
    // Create user message from the follow-up question
    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };
    
    // Add user message to conversation history
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsTyping(true);
    
    // Save user message to session
    await saveMessageToSession(userMessage);
    
    // Update question count
    const newCount = questionCount + 1;
    setQuestionCount(newCount);
    
    if (!user && newCount >= MAX_FREE_QUESTIONS) {
      setLocked(true);
      setTimeout(() => {
        const botMessage: ChatMessage = {
          role: 'assistant',
          content: "You have reached your limit of questions before you need to register. But don't worry. It is still free to ask as many questions as you want. This will also allow you to save all your questions and answers.",
          timestamp: new Date().toISOString()
        };
        setMessages(msgs => [...msgs, botMessage]);
        setIsTyping(false);
      }, 500);
    } else {
      // Generate AI response with the full conversation history
      const aiResult = await generateAIResponse(question);
      
      setTimeout(async () => {
        const botMessage: ChatMessage = {
          role: 'assistant',
          content: aiResult.response,
          timestamp: new Date().toISOString()
        };
        setMessages(msgs => [...msgs, botMessage]);
        
        // Save bot message to session
        await saveMessageToSession(botMessage);
        
        // Store follow-up questions for display
        if (aiResult.followUpQuestions && aiResult.followUpQuestions.length > 0) {
          setCurrentFollowUpQuestions(aiResult.followUpQuestions);
        }
        
        setIsTyping(false);
      }, 1000);
    }
  };

  useEffect(() => {
    if (inputRef.current && onboardingComplete) {
      inputRef.current.focus();
    }
  }, [onboardingComplete]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll to bottom when typing indicator appears/disappears
  useEffect(() => {
    scrollToBottom();
  }, [isTyping]);

  const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};



  const generateAIResponse = async (userQuestion: string): Promise<{ response: string; followUpQuestions: string[] }> => {
    // For testing - use fallback response instead of API call
    //console.log('TESTING: Using fallback response instead of API call');
    //return getFallbackResponse(userQuestion);
    
     
    // Main API call - commented out for testing
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userQuestion,
          userId: user?.id || null,
          conversationHistory: messages, // Send full conversation context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      console.log('DEBUG: AI Response received:', data.response);
      return {
        response: data.response,
        followUpQuestions: data.followUpQuestions || []
      };
    } catch (error) {
      console.error('AI response error:', error);
      return {
        response: getFallbackResponse(userQuestion),
        followUpQuestions: [
          "What's the next step in the process?",
          "How long does this typically take?",
          "What documents do I need?",
          "Should I speak with a lawyer?"
        ]
      };
    }
    
  };

  const generateOnboardingResponse = async (nextQuestion: any, userResponse: string, allResponses: any) => {
    try {
      const response = await fetch('/api/chat-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `User response: "${userResponse}". Next question: "${nextQuestion.question}". Please provide an engaging, personalized response that acknowledges their answer and asks the next question naturally.`,
          userId: user?.id || null,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Onboarding AI response error:', error);
      // Fallback to original question
      return nextQuestion.question;
    }
  };

  const generateWelcomeMessage = async () => {
    // Hardcoded welcome messages
    const welcomeMessages = [
      "Hey there! What are we working on today?",
      "What's on your mind today?",
      "How I can assist you today?"
    ];
    
    // Randomly select one message
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    return welcomeMessages[randomIndex];
  };

  const generateOnboardingCompletion = async (finalResponse: string, allResponses: any) => {
    try {
      const response = await fetch('/api/chat-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `User's final response: "${finalResponse}". All previous responses: ${JSON.stringify(allResponses)}. Please provide an engaging completion message that acknowledges their situation and invites them to ask specific questions about their divorce rights. Make it warm and encouraging.`,
          userId: user?.id || null,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Onboarding completion AI response error:', error);
      // Fallback completion message
      return "Perfect! Now I can help you with specific questions about your divorce rights. What would you like to know?";
    }
  };

  const getFallbackResponse = (question: string) => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('custody') || lowerQuestion.includes('kids') || lowerQuestion.includes('children')) {
      return "In NY, custody decisions are based on the child's best interests. Factors include the child's relationship with each parent, stability, and the child's wishes (if they're old enough). Joint custody is preferred when possible. Would you like to know more about filing for custody?";
    }
    
    if (lowerQuestion.includes('support') || lowerQuestion.includes('alimony') || lowerQuestion.includes('maintenance')) {
      return "NY has guidelines for child support and spousal maintenance. Child support is calculated using both parents' incomes and the number of children. Spousal maintenance depends on income disparity and marriage length. I can help you estimate potential amounts.";
    }
    
    if (lowerQuestion.includes('property') || lowerQuestion.includes('assets') || lowerQuestion.includes('division')) {
      return "NY is an equitable distribution state, meaning marital property is divided fairly (not necessarily 50/50). Marital property includes assets acquired during marriage. Separate property (owned before marriage) usually stays with the original owner.";
    }
    
    if (lowerQuestion.includes('file') || lowerQuestion.includes('process') || lowerQuestion.includes('how to')) {
      return "To file for divorce in NY, you need to: 1) Meet residency requirements (live in NY for 1 year), 2) File a Summons with Notice or Summons and Complaint, 3) Serve your spouse, 4) Complete financial disclosure, 5) Attend court if uncontested, or go through discovery if contested.";
    }
    
    if (lowerQuestion.includes('grounds') || lowerQuestion.includes('reason') || lowerQuestion.includes('why')) {
      return "NY allows both fault and no-fault divorces. No-fault is most common - you can cite 'irretrievable breakdown' of the marriage for 6+ months. Fault grounds include adultery, abandonment, cruel treatment, or imprisonment. No-fault is usually faster and less expensive.";
    }
    
    if (lowerQuestion.includes('separation') || lowerQuestion.includes('legal separation')) {
      return "Legal separation in NY is different from divorce. It's a court order that addresses custody, support, and property division while keeping you legally married. Some people choose this for religious reasons or to maintain health insurance benefits.";
    }
    
    if (lowerQuestion.includes('ex') || lowerQuestion.includes('spouse') || lowerQuestion.includes('partner')) {
      return "I understand you're dealing with relationship issues. In NY, you have legal options whether you're married or not. For specific guidance about your situation, I'd recommend speaking with one of our attorneys who can provide personalized advice.";
    }
    
    return "I understand you're asking about divorce in NY. While I can provide general information, for specific legal advice tailored to your situation, I recommend consulting with an attorney. Would you like to schedule a consultation with one of our lawyers?";
  };

  const loadSpecificChat = async (chatId: string) => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const history = await ChatSessionManager.getChatSession(chatId);
      if (history.length > 0) {
        setMessages(history);
        // Check if onboarding was completed in this chat
        const hasOnboardingComplete = history.some(msg => 
          msg.content.includes("Thanks for sharing that") || 
          msg.content.includes("which state are you in")
        );
        setOnboardingComplete(hasOnboardingComplete);
        // Only hide welcome if we're not in showWelcomeOnLogin mode
        if (!showWelcomeOnLogin) {
          setShowWelcome(false);
        }
      }
    } catch (error) {
      console.error('Error loading specific chat:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveMessageToSession = async (message: ChatMessage) => {
    if (!user) return;
    
    const chatIdToUse = currentChatId ?? chatIdRef.current;
    if (!chatIdToUse) return;

    try {
      await ChatSessionManager.addMessage(chatIdToUse, message);
      //console.log('DEBUG: Saved message to session');
    } catch (error) {
      //console.error('Error saving message to session:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || locked || isTyping) return;
    
    // If still in onboarding AND user is not logged in, handle onboarding response
    if (!user && !onboardingComplete) {
      handleOnboardingResponse(input.trim());
      return;
    }
    
    // If user is logged in and we're in welcome view (showWelcomeOnLogin), create a new chat
    if (user && showWelcomeOnLogin && !currentChatId) {
      try {
        const newChatId = await ChatSessionManager.createNewChat(user.id);
        if (newChatId) {
          setCurrentChatId(newChatId);
          chatIdRef.current = newChatId;
          setJustCreatedNewChat(true); // Set the flag
          // Notify parent component about the new chat selection
          if (onChatSelect) {
            onChatSelect(newChatId);
          }
          // Dismiss welcome view
          if (onWelcomeDismissed) {
            onWelcomeDismissed();
          }
          // Trigger sidebar refresh
          if (onChatCreated) {
            onChatCreated();
          }
        }
      } catch (error) {
        console.error('Error creating new chat:', error);
        return; // Don't proceed if chat creation failed
      }
    }

    const userMessage = input.trim();
    //console.log('DEBUG: Sending message:', userMessage);
    
    const userChatMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    const newMessages = [...messages, userChatMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    setCurrentFollowUpQuestions([]); // Clear follow-up questions when user sends a new message
    
    // Save user message to session
    await saveMessageToSession(userChatMessage);
    
    const newCount = questionCount + 1;
    setQuestionCount(newCount);
    
    if (!user && newCount >= MAX_FREE_QUESTIONS) {
      setLocked(true);
      setTimeout(() => {
        const botMessage: ChatMessage = {
          role: 'assistant',
          content: 'You’ve reached your limit of questions before you need to register. But don’t worry. It is still free to ask as many questions as you want. This will also allow you to save all your questions and answers.',
          timestamp: new Date().toISOString()
        };
        setMessages(msgs => [...msgs, botMessage]);
        setIsTyping(false);
      }, 500);
    } else {
      // Generate AI response
      const aiResult = await generateAIResponse(userMessage);
      
      setTimeout(() => {
        const botMessage: ChatMessage = {
          role: 'assistant',
          content: aiResult.response,
          timestamp: new Date().toISOString()
        };
        setMessages(msgs => [...msgs, botMessage]);
        
        // Save bot message to session
        saveMessageToSession(botMessage);
        
        // Store follow-up questions for display
        if (aiResult.followUpQuestions && aiResult.followUpQuestions.length > 0) {
          setCurrentFollowUpQuestions(aiResult.followUpQuestions);
        }
        
        setIsTyping(false);
      }, 1000);
    }
  };

  const checkBasicInfo = async (forceRefresh = false): Promise<boolean> => {
    if (!user) return false;
    
    //console.log('Checking basic info for user:', user.id);
    try {
      // First check if profile exists
      const { data: profileExists, error: existsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      //console.log('Profile exists check:', { profileExists, existsError });
      
      if (!profileExists) {
        //console.log('No profile found for user, showing modal');
        setHasBasicInfo(false);
        return false;
      }
      
      // Now get the full profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('yourfullname, youremail, yourphone, youraddress, spousefullname, spouselastknownaddress')
        .eq('id', user.id)
        .single();
      
      //console.log('Profile query result:', { profile, error });
      
      if (error) {
        console.log('Profile data error, treating as incomplete info');
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
      //console.log('Basic info check result:', hasInfo, 'Missing fields:', missingFields);
      setHasBasicInfo(hasInfo);
      return hasInfo;
    } catch (error) {
      console.error('Error checking basic info:', error);
      setHasBasicInfo(false);
      return false;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };



  return (
    <div className="w-full max-w-4xl mx-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full px-4 sm:px-6">
        {/* Welcome Screen */}
        {(showWelcome && !user) || (user && showWelcomeOnLogin) ? (
          <div className="px-4 sm:px-6 py-4" style={{ backgroundColor: 'var(--bg-primary)', marginTop: '100px' }}>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex items-center justify-center mb-4">
                {/* Mobile Logo - Smaller size */}
                <img src="/Uncouple_logo.png" alt="Uncouple Logo" className="w-20 h-20 sm:w-20 sm:h-20 md:hidden" />
                {/* Desktop Logo - Medium size for md screens */}
                <img src="/Uncouple_logo.png" alt="Uncouple Logo" className="w-28 h-28 lg:hidden hidden md:block" />
                {/* Large Logo - Larger size for lg+ screens */}
                <img src="/Uncouple_logo.png" alt="Uncouple Logo" className="w-32 h-32 hidden lg:block" />
              </div>
              <p className="text-base sm:text-lg mb-8 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                The world&apos;s first AI powered divorce service
              </p>
                
                {/* Welcome Page Input Field */}
                <div className="w-full max-w-2xl mx-auto">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      className="flex-1 border rounded-2xl px-3 py-3 sm:py-4 text-sm focus:outline-none focus:border-transparent"
                      style={{ 
                        backgroundColor: 'var(--bg-card)', 
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-secondary)'
                      }}
                      placeholder="How can I help you?"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { 
                      if (e.key === 'Enter') {
                        if (showWelcome || showWelcomeOnLogin) {
                          handleWelcomeOption('ask_directly');
                          if (input.trim()) {
                            handleSend();
                          }
                        } else {
                          handleSend();
                        }
                      }
                    }}
                      disabled={locked}
                    />
                    <button 
                      className="p-2 bg-gradient-to-r text-white rounded-lg transition-all duration-200 transform hover:scale-105" 
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--text-secondary)',
                        borderColor: 'var(--border-secondary)'
                      }}
                      onClick={() => {
                      if (showWelcome || showWelcomeOnLogin) {
                        handleWelcomeOption('ask_directly');
                        if (input.trim()) {
                          handleSend();
                        }
                      } else {
                        handleSend();
                      }
                    }} 
                      aria-label="Send" 
                      disabled={locked}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
        ) : null}

        {/* Messages */}
        {!showWelcome && !(user && showWelcomeOnLogin) && (
          <div className="px-4 sm:px-6 py-4 pb-20 sm:pb-32" style={{ backgroundColor: 'var(--bg-primary)' }}>
            {isLoadingHistory && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--text-muted)' }} />
                <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>Loading chat history...</span>
              </div>
            )}
            
            {/* Older Messages Button */}
            {messages.length > 5 && (
              <div className="mb-4 mt-2">
                <button
                  onClick={() => setShowOlderMessages(!showOlderMessages)}
                  className="flex items-center mx-auto gap-2 text-xs transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <History className="h-3 w-3" />
                  {showOlderMessages ? 'Hide' : 'Show'} older messages ({messages.length - 5} more)
                </button>
              </div>
            )}
            
            {messages.map((msg, idx) => {
              if (!showOlderMessages && idx < messages.length - 5) {
                return null;
              }
              
              return (
                <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 max-w-[85%] sm:max-w-[80%] text-sm`} style={{
                    background: msg.role === 'user' ? 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' : 'linear-gradient(to left, var(--accent-tertiary), var(--accent-quaternary))',
                    color: msg.role === 'user' ? 'var(--text-secondary)' : 'var(--text-secondary)'
                  }}>
                    {msg.content}
                    <div className={`text-xs mt-1 text-right`} style={{
                      color: msg.role === 'user' ? 'var(--text-secondary)' : 'var(--text-muted)'
                    }}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          
            {isTyping && (
              <div className="mb-4 flex justify-start">
                <div className="rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-sm" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-primary)', animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-primary)', animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-primary)', animationDelay: '300ms' }}></div>
                    </div>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
            
            {/* Follow-up Questions */}
            {/* {currentFollowUpQuestions.length > 0 && !isTyping && (
              <div className="mt-4 space-y-2">
                <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>You might also want to know:</div>
                <div className="flex flex-col gap-2 items-start" style={{ }}>
                  {currentFollowUpQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleFollowUpQuestion(question)}
                      className="text-xs px-3 py-2 rounded-lg transition-colors border w-fit max-w-full"
                      style={{ 
                        backgroundColor: 'var(--accent-tertiary)', 
                        color: 'var(--text-secondary)',
                        borderColor: 'var(--border-primary)'
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        )}
      </div>
      
      {/* Input Area - Fixed at Viewport Bottom */}
      <div
        className={getInputAreaClasses()}
        style={{ backgroundColor: 'var(--bg-primary)', marginBottom: '40px' }}>
        <div className="flex justify-center" style={{ }}>
          <div className="w-full max-w-4xl px-4 sm:px-6">
            {!locked && !showWelcome && (
              <>
                {/* Login Prompt */}
                {showLoginPrompt && (
                  <div className="mb-4 flex flex-col items-center justify-center py-4">
                    <div className="text-center mb-4">
                      <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Ready to continue your divorce process?</div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => window.location.href = '/login'}
                        className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Log In
                      </button>
                      <button
                        onClick={() => window.location.href = '/signup'}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Onboarding Multiple Choice Options */}
                {!user && !onboardingComplete && !showWelcome && currentQuestion?.type === 'multiple_choice' && (
                  <div className="mb-4 space-y-2">
                    {currentQuestion.options?.map((option, index) => (
                      <button
                        key={index}
                        className="w-full text-left p-3 rounded-lg border transition-colors text-sm"
                        style={{ 
                          borderColor: 'var(--border-secondary)', 
                          color: 'var(--text-secondary)'
                        }}
                        onClick={() => handleMultipleChoiceResponse(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Regular Suggestions (only show after onboarding) */}
                {onboardingComplete && !showLoginPrompt && (
                  <div className="hidden md:flex items-center gap-2 mb-2 flex-wrap">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} className="text-xs px-3 py-1 rounded-full mr-2 mb-2 transition-colors" style={{ backgroundColor: 'var(--accent-tertiary)', color: 'var(--text-muted)' }} onClick={() => setInput(s)}>{s}</button>
                    ))}
                  </div>
                )}
                
                {/* Input field (hide when showing login prompt) */}
                {!showLoginPrompt && (
                  <div className="flex items-center gap-2" style={{marginBottom: '10px'}}>
                    <input
                      ref={inputRef}
                      className="flex-1 border rounded-2xl px-3 py-3 sm:py-4 text-sm focus:outline-none focus:border-transparent"
                      style={{ 
                        backgroundColor: 'var(--bg-card)', 
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-secondary)',
                      }}
                      placeholder={onboardingComplete ? "Ask anything" : "Type your response..."}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                      disabled={locked}
                    />
                    <button className="p-2 bg-gradient-to-r text-white rounded-lg transition-all duration-200 transform hover:scale-105" 
                     style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-secondary)'
                     }}
                      onClick={handleSend} aria-label="Send" disabled={locked}>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                )}
              </>
            )}
            {locked && !user && (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="mb-4 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>Sign up to continue and save your questions/answers.</div>
                <a href="/signup" className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white px-6 py-2 rounded-lg font-semibold transition-colors">Sign Up</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}