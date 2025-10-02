'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatbot } from './ChatbotContext';
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

// Welcome options
const WELCOME_OPTIONS = [
  {
    id: 'start_onboarding',
    title: "Get Started",
    description: "Answer a few questions to get personalized help",
    icon: "📋"
  },
  {
    id: 'ask_directly',
    title: "Ask Directly",
    description: "Ask your divorce questions right away",
    icon: "💬"
  }
];

// Onboarding flow questions
const ONBOARDING_QUESTIONS = [
  // {
  //   id: 'help',
  //   question: "Hi there — how can we help you today?",
  //   type: 'open'
  // },
  {
    id: 'situation',
    question: "Which of these best describes your situation right now?",
    type: 'multiple_choice',
    options: [
      "I'm just thinking about divorce",
      "I'm not sure if I want to move forward", 
      "I'm ready to get started",
      "I've already started the process"
    ]
  },
  {
    id: 'state',
    question: "Thanks for sharing that. Just so we can give you the right help — which state are you in?",
    type: 'open'
  }
];

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

export default function ChatbotWidget() {
  const { isChatbotOpen: open, setChatbotOpen: setOpen } = useChatbot();
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
  const [showLawyerDropdown, setShowLawyerDropdown] = useState(false);
  const [hasBasicInfo, setHasBasicInfo] = useState<boolean | null>(null);
  const [currentFollowUpQuestions, setCurrentFollowUpQuestions] = useState<string[]>([]);
  
  // Welcome and onboarding flow state
  const [showWelcome, setShowWelcome] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingResponses, setOnboardingResponses] = useState<{[key: string]: string}>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
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
      // Reset to welcome screen
      resetToWelcome();
    }
  }, [user]);

  // Load chat history when user logs in
  useEffect(() => {
    if (user && open) {
      loadChatHistory();
    }
  }, [user, open]);

  // Start welcome screen for non-logged-in users when chatbot opens
  useEffect(() => {
    if (!user && open && messages.length === 0) {
      setShowWelcome(true);
      setMessages([]);
    }
  }, [user, open, messages.length]);

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
      } else {
        // Logged-in users skip onboarding and go straight to free questions
        const welcomeMessage: ChatMessage = {
          role: 'assistant',
          content: "Hi, I'm Uncouple AI assistant. I can help you understand your divorce rights in NY. What's on your mind?",
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
        setOnboardingComplete(true);
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
    
    const firstQuestion = ONBOARDING_QUESTIONS[0];
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: firstQuestion.question,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    setShowWelcome(false);
    setOnboardingStep(0);
    setOnboardingComplete(false);
  };

  const handleWelcomeOption = (optionId: string) => {
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
                    message: `The user is not in New York. Please provide a message informing them that mentioned state goes live in 2 days and you'll notify them when it's ready.`,
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
                    content: "mentioned state goes live in 2 days – we'll notify you as soon as it's ready.",
                    timestamp: new Date().toISOString()
                  };
                }
              } catch (error) {
                console.error('Error generating non-NY completion message:', error);
                completionMessage = {
                  role: 'assistant',
                  content: "mentioned state goes live in 2 days – we'll notify you as soon as it's ready.",
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
                content: "mentioned state goes live in 2 days – we'll notify you as soon as it's ready.",
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
              content: "mentioned state goes live in 2 days – we'll notify you as soon as it's ready.",
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

  useEffect(() => {
    if (open && inputRef.current && onboardingComplete) {
      inputRef.current.focus();
    }
  }, [open, onboardingComplete]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showLawyerDropdown && !target.closest('.lawyer-dropdown')) {
        setShowLawyerDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLawyerDropdown]);

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

  const saveMessageToSession = async (message: ChatMessage) => {
    if (!user) return;
    
    try {
      await ChatSessionManager.addMessage(user.id, message);
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
    <>
      {/* Floating AI Assistant Button */}
      <button
        className="fixed bottom-6 right-6 z-50 group"
        onClick={() => setOpen(true)}
        aria-label="Open AI assistant"
      >
        {/* Main Button */}
        <div className="relative animate-float">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
          
          {/* Button Container */}
          <div className="relative bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-full shadow-2xl p-4 flex items-center justify-center transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-cyan-500/25 animate-glow">
            {/* AI Icon */}
            <div className="relative">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              
              {/* Animated Dots */}
              <div className="absolute -top-1 -right-1 flex space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
          
          {/* Pulse Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping"></div>
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            AI Assistant
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>

      {/* Chatbot Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          
          {/* Chat Window */}
          <div className="relative w-full max-w-2xl h-[720px] rounded-t-2xl shadow-2xl flex flex-col mr-10 mb-10 animate-slideup" style={{ maxHeight: '90vh', minWidth: '480px', backgroundColor: 'rgb(10 15 28)', boxShadow: 'rgb(183 177 177 / 18%) 1px 2px 20px' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <div className="font-semibold text-gray-100 flex items-center gap-2">
                    Uncouple AI
                  </div>
                  <div className="text-xs text-gray-400">NY Divorce Rights Assistant</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {/* Start Uncontested Divorce Process Button */}
                <button 
                  className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-colors" 
                  onClick={() => {
                    // Close the chatbot
                    setOpen(false);
                    
                    if (!user) {
                      window.location.href = '/signup';
                    } else {
                      router.push('/payment');
                    }
                  }}
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Start Uncontested Divorce
                </button>
                
                <div 
                  className="relative lawyer-dropdown-container"
                  onMouseEnter={async () => {
                    //console.log('Hover handler called');
                    if (user) {
                      const hasInfo = await checkBasicInfo();
                      //console.log('Hover basic info result:', hasInfo);
                      if (hasInfo) {
                        setShowLawyerDropdown(true);
                      }
                    }
                  }}
                  onMouseLeave={() => setShowLawyerDropdown(false)}
                >
                  <button 
                    className="flex items-center gap-1 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors" 
                    onClick={() => {
                      //console.log('Click handler called. Dropdown open:', showLawyerDropdown, 'Has basic info:', hasBasicInfo);
                      if (!user) {
                        window.location.href = '/signup';
                      } else {
                        // Simple toggle - if dropdown is open, close it
                        if (showLawyerDropdown) {
                          //console.log('Closing dropdown');
                          setShowLawyerDropdown(false);
                        } else {
                          // Always force a fresh check when clicking
                          //console.log('Force refreshing basic info check on click');
                          checkBasicInfo(true).then(hasInfo => {
                            //console.log('Basic info check completed:', hasInfo);
                            if (hasInfo) {
                              setShowLawyerDropdown(true);
                            } else {
                              setShowBasicInfoModal(true);
                            }
                          });
                        }
                      }
                    }}
                  >
                    <Phone className="h-4 w-4 mr-1" /> Speak to a Lawyer
                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showLawyerDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showLawyerDropdown && (
                    <div className="absolute right-0 top-full w-80 bg-gray-900/80 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 z-50 lawyer-dropdown lawyer-dropdown-container">
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-100 mb-3">Available Lawyers</h3>
                        <div className="space-y-3">
                          {AVAILABLE_LAWYERS.map((lawyer) => (
                            <button
                              key={lawyer.id}
                              className="w-full text-left p-3 rounded-lg border border-gray-700 hover:border-cyan-500 hover:bg-gray-800/60 transition-colors"
                              onClick={() => {
                                window.open(lawyer.calendly, '_blank');
                                setShowLawyerDropdown(false);
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold text-gray-100">{lawyer.name}</div>
                                  <div className="text-sm text-gray-300">{lawyer.title}</div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    ⭐ {lawyer.rating} • {lawyer.experience} experience
                                  </div>
                                </div>
                                <div className="text-xs text-cyan-400 font-medium">Schedule</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {showBasicInfoModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Complete Basic Information</h3>
                      <p className="text-gray-700 mb-4">To schedule a call with a lawyer, you need to complete all basic information including:</p>
                      <ul className="text-sm text-gray-600 mb-6 text-left space-y-1">
                        <li>• Your full name and contact details</li>
                        <li>• Your address</li>
                        <li>• Spouse&apos;s full name and address</li>
                      </ul>
                      <button
                        className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white px-6 py-2 rounded-lg font-semibold transition-colors w-full mb-2"
                        onClick={() => {
                          setShowBasicInfoModal(false);
                          setOpen(false);
                          router.push('/information-collection');
                        }}
                      >
                        Complete Information
                      </button>
                      <button
                        className="text-gray-500 hover:text-gray-700 text-sm mt-2"
                        onClick={() => setShowBasicInfoModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Older Messages Button */}
            {messages.length > 5 && (
              <div className="px-6 py-2 border-b border-gray-800">
                <button
                  onClick={() => setShowOlderMessages(!showOlderMessages)}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <History className="h-3 w-3" />
                  {showOlderMessages ? 'Hide' : 'Show'} older messages ({messages.length - 5} more)
                </button>
              </div>
            )}
            
            {/* Welcome Screen */}
            {showWelcome && !user && (
              <div className="flex-1 overflow-y-auto px-6 py-4 chatbot-messages" style={{ backgroundColor: 'rgb(20 28 40)' }}>
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-full w-16 h-16 flex items-center justify-center text-white text-2xl mb-4">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-100 mb-2">Welcome to Uncouple</h2>
                  <p className="text-gray-400 text-sm mb-6">The world&apos;s first AI powered divorce service</p>
                  
                  <div className="space-y-3 w-full max-w-sm">
                    {WELCOME_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleWelcomeOption(option.id)}
                        className="w-full p-4 rounded-lg border border-gray-700 hover:border-cyan-500 hover:bg-gray-800/60 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{option.icon}</div>
                          <div>
                            <div className="font-semibold text-gray-100 group-hover:text-cyan-400 transition-colors">
                              {option.title}
                            </div>
                            <div className="text-sm text-gray-400">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {!showWelcome && (
              <div className="flex-1 overflow-y-auto px-6 py-4 chatbot-messages" style={{ backgroundColor: 'rgb(20 28 40)' }}>
                {isLoadingHistory && (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400 text-sm">Loading chat history...</span>
                  </div>
                )}
                
                {messages.map((msg, idx) => {
                  // Show only recent messages unless showOlderMessages is true
                  if (!showOlderMessages && idx < messages.length - 5) {
                    return null;
                  }
                  
                  return (
                    <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${msg.role === 'user' ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-gray-100 text-sm' : 'bg-gray-800 text-gray-300 text-sm'}`}>
                        {msg.content}
                        <div className={`text-xs mt-1 text-right ${msg.role === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              
                {isTyping && (
                  <div className="mb-4 flex justify-start">
                    <div className="rounded-2xl px-4 py-3 bg-gray-800 text-gray-300 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Invisible div for auto-scroll */}
                <div ref={messagesEndRef} />
                
                {/* Follow-up Questions */}
                {currentFollowUpQuestions.length > 0 && !isTyping && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-gray-400 mb-2">You might also want to know:</div>
                    <div className="flex flex-wrap gap-2">
                      {currentFollowUpQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleFollowUpQuestion(question)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-2 rounded-lg transition-colors border border-gray-700 hover:border-cyan-500"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Input Area */}
            <div className="px-6 py-4 border-t border-gray-800" style={{ backgroundColor: 'rgb(10 15 28)' }}>
              {!locked && !showWelcome && (
                <>
                  {/* Login Prompt */}
                  {showLoginPrompt && (
                    <div className="mb-4 flex flex-col items-center justify-center py-4">
                      <div className="text-center mb-4">
                        <div className="text-gray-300 text-sm mb-2">Ready to continue your divorce process?</div>
                      </div>
                      <div className="flex gap-3">
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
                          className="w-full text-left p-3 rounded-lg border border-gray-700 hover:border-cyan-500 hover:bg-gray-800/60 transition-colors text-gray-300 text-sm"
                          onClick={() => handleMultipleChoiceResponse(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Regular Suggestions (only show after onboarding) */}
                  {onboardingComplete && !showLoginPrompt && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {SUGGESTIONS.map((s, i) => (
                        <button key={i} className="bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full mr-2 mb-2 transition-colors" onClick={() => setInput(s)}>{s}</button>
                      ))}
                    </div>
                  )}
                  
                  {/* Input field (hide when showing login prompt) */}
                  {!showLoginPrompt && (
                    <div className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        className="bg-gray-900 text-gray-200 flex-1 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder={onboardingComplete ? "Ask about your divorce rights in NY..." : "Type your response..."}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                        disabled={locked}
                      />
                      <button className="p-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-lg transition-all duration-200 transform hover:scale-105" onClick={handleSend} aria-label="Send" disabled={locked}>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  )}
                </>
              )}
              {locked && !user && (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="mb-4 text-gray-700 text-center font-semibold">Sign up to continue and save your questions/answers.</div>
                                     <a href="/signup" className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white px-6 py-2 rounded-lg font-semibold transition-colors">Sign Up</a>
                </div>
              )}
            </div>
            {/* Disclaimer */}
            {/* <div className="text-center text-xs text-gray-400 py-2 border-t border-gray-800" style={{ backgroundColor: 'rgb(10 15 28)' }}>
              Uncouple provides legal information, not legal advice. For specific legal guidance, consult with a qualified attorney.
            </div> */}
          </div>
        </div>
      )}
    </>
  );
} 