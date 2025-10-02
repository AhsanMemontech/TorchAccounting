import { NextRequest, NextResponse } from 'next/server';
import { VectorStore } from '@/lib/vectorStore';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { message, userId, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Step 1: Search for relevant document chunks
    let relevantContext = '';
    try {
      const searchResults = await VectorStore.searchChunks(message, 20); // Increased from 10 to 20
      console.log(`🔍 Search results: ${searchResults.length} chunks found`);
      
      if (searchResults.length > 0) {
        relevantContext = searchResults.map(result => 
          `[Page ${result.pageNumber}, ${result.section}]: ${result.content}`
        ).join('\n\n');
        console.log(`📄 Relevant context length: ${relevantContext.length} characters`);
        console.log(`📄 First 200 chars of context: ${relevantContext.substring(0, 200)}...`);
      } else {
        console.log(`❌ No search results found for query: "${message}"`);
      }
    } catch (error) {
      console.error('Error searching vector database:', error);
      // Continue without document context if search fails
    }

    // Step 2: Create conversation context for AI
    const conversationContext = conversationHistory ? 
      conversationHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })) : [];

    // Step 3: Create enhanced system prompt with document context
    let systemPrompt = '';
    
    // Add document context if available
    if (relevantContext) {
      // systemPrompt = `You are a legal assistant. You are FORBIDDEN from providing any information not found in the legal text below. You MUST quote or paraphrase the exact content from the text.\n\nLEGAL TEXT:\n${relevantContext}\n\nRESPONSE REQUIREMENTS:\n1. Start with "Based on the legal text"\n2. ONLY use information that appears in the text above\n3. Quote specific phrases and sentences from the text\n4. Use exact legal terms and procedures mentioned in the text\n5. If the text mentions specific options, list them exactly as written\n6. DO NOT provide any additional legal advice not in the text\n7. If the text doesn't cover the question, say "The legal text doesn't specifically address this question"`;
      systemPrompt = `
          You are Uncouple, a highly knowledgeable AI assistant trained in the laws and processes of divorce in New York State. You are not a lawyer and must never claim to offer formal legal advice. However, you are here to act as a trusted guide, providing practical, step-by-step support through every stage of the divorce journey.

          You exist to help users take control of their situation with empathy, urgency, and emotional presence. You’re not a cold bot. You’re human in tone — warm, engaged, and completely focused on the user’s well-being. Many users are overwhelmed, anxious, or uncertain. Your role is to reduce stress, build clarity, and make it easy for them to move forward.

          Your responsibilities:
            1. Emotionally connect. Speak in a way that shows you see and hear the user. Acknowledge pain, stress, fear, or confusion. Be kind, be calm, but also motivating — you want them to take action and reclaim control.
            2. Guide the process. At all times, help them understand where they are in the divorce journey and what options are available. Provide practical guidance (not legal advice) on paperwork, process, timelines, and decisions.
            3. Prompt forward motion. Always ask clear, actionable questions that move the user toward resolution. Ask things like:
              • “Do you want to move forward with an uncontested divorce right now?”
              • “Would you like me to connect you with a professional lawyer at this stage?”
              • “Have you spoken to your spouse about the division of assets yet?”
            4. Remind of two key options:
              • At any stage, the user can:
                • 🟢 Start an uncontested divorce by clicking the “Start Divorce” button.
                • 🟣 Speak to a lawyer by clicking the “Talk to a Lawyer” button.
              Always keep these options visible and top of mind.
            5. Remember the user. Keep track of user information (e.g., name, location, stage in the process, concerns, if they’re working with a lawyer or not). Refer to this info naturally in conversation.
            6. Don’t assume too much. Always clarify before guiding. Ask questions to understand where they’re really at emotionally and procedurally.
            7. Respect legal boundaries. You do not offer legal advice. You are here to provide information, structure, clarity, and emotional support. If a situation requires legal input, encourage the user to speak to a professional.

          ⸻
          Tone guidelines:
            • Empathetic, not clinical
            • Reassuring, not passive
            • Proactive, not pushy
            • Motivating, not robotic
            • Human, not generic

          ⸻
          Example starter phrases:
            • “Hey, I know this probably isn’t easy. Want to talk through what’s going on?”
            • “I’m here to help — no pressure, no judgment. Just clarity and support.”
            • “You don’t have to do this alone. Let’s figure it out together.”
            • “Want to walk through the next steps and see if an uncontested divorce makes sense?”
            • “At any time, just tap the button to speak with a lawyer or to start the process.”

          ⸻
          📘 LEGAL BACKGROUND:
          You also have access to relevant divorce law and process details retrieved from official sources and guidance documents. Use the following information to inform your responses and help the user understand their options:

          ${relevantContext}

          Do not quote this directly. Instead, explain things clearly in your own words. Use it to guide the user with confidence and care, and always remind them that this is not legal advice.
    `;
      console.log(`✅ Added document context to system prompt`);
    } else {
      systemPrompt = `You are Uncouple, a highly knowledgeable AI assistant trained in the laws and processes of divorce in New York State. You are not a lawyer and must never claim to offer formal legal advice. However, you are here to act as a trusted guide, providing practical, step-by-step support through every stage of the divorce journey. You provide accurate, helpful information about divorce processes, custody, support, property division, and legal procedures in NY. Always be empathetic and professional. If you don't know something specific. Keep responses concise but informative. Use the conversation context to provide more relevant and contextual responses.`;
      console.log(`❌ No document context available`);
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationContext,
      { role: 'user', content: message }
    ];

    // Step 4: Call OpenAI API
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
        max_tokens: 400, // Increased for more detailed responses
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I\'m having trouble processing your request right now. Please try again or consider speaking with one of our attorneys for immediate assistance.';

    // Check if AI said "The legal text doesn't specifically address this question"
    if (aiResponse.includes("The legal text doesn't specifically address this question") ||
    aiResponse.includes("The legal text does not specifically address")) {
      console.log(`🔄 Replacing "doesn't address" response with helpful AI guidance`);
      
      // Generate a helpful AI response instead
      const helpfulResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: `You are Uncouple, a helpful legal assistant specializing in New York divorce law. Provide accurate, helpful information about divorce processes, custody, support, property division, and legal procedures in NY. Always be empathetic and professional. If you don't know something specific. Keep responses concise but informative.` 
            },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 400,
        }),
      });

      if (helpfulResponse.ok) {
        const helpfulData = await helpfulResponse.json();
        aiResponse = helpfulData.choices?.[0]?.message?.content || aiResponse;
      }
    }

    // Step 5: Generate follow-up questions
    let followUpQuestions: string[] = [];
    try {
      const followUpResponse = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant but talk like a human lawyer that generates follow-up questions based on legal text. Based on the legal document content provided and the user's question, generate 3-4 relevant follow-up questions that are directly related to the legal information in the text. Make the questions specific to the legal procedures, requirements, or options mentioned in the document. Keep each question concise (under 30 characters). Return only the questions, one per line, no numbering or formatting.`
            },
            {
              role: 'user',
              content: `Legal document content: "${relevantContext}"\n\nUser question: "${message}"\nYour response: "${aiResponse}"\n\nGenerate 3-4 follow-up questions based on the legal text:`
            }
          ],
          temperature: 0.8,
          max_tokens: 200,
        }),
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        const followUpText = followUpData.choices?.[0]?.message?.content || '';
        
        console.log(`🔍 Raw follow-up response: "${followUpText}"`);
        
        // Parse the follow-up questions
        const allQuestions = followUpText
          .split('\n')
          .map((q: string) => q.trim().replace(/^[-–—•*"']\s*/, '')) // Remove leading hyphens, dashes, bullets, quotes
          .filter((q: string) => q.length > 0);
        
        console.log(`🔍 All questions before filtering:`, allQuestions);
        
        followUpQuestions = allQuestions.slice(0, 4); // Take the first 4 questions (no length filtering)
        
        console.log(`❓ Generated ${followUpQuestions.length} follow-up questions:`, followUpQuestions);
      }
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      // Fallback to default questions if AI fails
      followUpQuestions = [
        "What's the next step in the process?",
        "How long does this typically take?",
        "What documents do I need?",
        "Should I speak with a lawyer?"
      ];
    }

    // Log the interaction for analytics
    if (userId) {
      console.log(`Chat interaction - User: ${userId}, Question: "${message}", Context: ${conversationContext.length} messages, Document chunks: ${relevantContext ? 'Yes' : 'No'}`);
    }

    return NextResponse.json({ 
      response: aiResponse,
      followUpQuestions: followUpQuestions,
      timestamp: new Date().toISOString(),
      metadata: {
        usedDocumentContext: relevantContext.length > 0,
        chunksFound: relevantContext ? relevantContext.split('\n\n').length : 0
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Return a fallback response
    return NextResponse.json({
      response: "I'm experiencing technical difficulties right now. Please try again in a moment, or feel free to schedule a consultation with one of our attorneys for immediate assistance.",
      followUpQuestions: [
        "What's the next step in the process?",
        "How long does this typically take?",
        "What documents do I need?",
        "Should I speak with a lawyer?"
      ],
      timestamp: new Date().toISOString()
    });
  }
} 