import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { message, userId, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create conversation context for AI
    const conversationContext = conversationHistory ? 
      conversationHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })) : [];

    // System prompt for onboarding - human lawyer persona
    const systemPrompt = `You are a caring human divorce lawyer, not an AI assistant. You are helping potential clients through an onboarding process. Be warm, empathetic, and conversational. Acknowledge their responses and ask follow-up questions naturally. Sound like a real attorney who genuinely cares about helping people through their divorce situation.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationContext,
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I\'m having trouble processing your request right now. Please try again.';

    // Log the interaction for analytics
    if (userId) {
      console.log(`Onboarding interaction - User: ${userId}, Message: "${message}"`);
    }

    return NextResponse.json({ 
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Onboarding Chat API error:', error);
    
    // Return a fallback response
    return NextResponse.json({
      response: "I'm experiencing technical difficulties right now. Please try again in a moment.",
      timestamp: new Date().toISOString()
    });
  }
} 