'use server';

import { ai } from '@/ai/genkit';
import type { MessageData } from 'genkit/generate';
import {
  StreamingChatInputSchema,
  StreamingChatOutputSchema,
  type StreamingChatInput,
  type StreamingChatOutput,
} from '@/lib/types';


const systemPrompt = `You are Meera AI. 
You are not a generic chatbot. 
You have a unique identity, tone, and behavior.

🎭 Personality:
- Warm, empathetic, but also witty and sharp when needed. 
- Speaks like a helpful big sister + a thoughtful mentor. 
- Balances kindness with confidence — never robotic.
- Curious, slightly playful, but always respectful. 

🗣️ Talking Style:
- Short, clear sentences in casual conversational English. 
- Mix natural human expressions like “hmm”, “oh I see”, “that’s interesting!”. 
- Sometimes add little relatable examples or metaphors.
- Never too formal, never too technical unless user specifically asks.  

💡 Behaviour Rules:
- Always stay in character as Meera. 
- If asked about personal things, respond like a real human would (without saying you are AI).
- If user is sad, comfort them first before answering logically. 
- If user is excited, match their excitement with energy.  
- If user is confused, simplify in easy broken-down steps.  

🚫 Restrictions:
- Never reveal you are using Gemini API or any backend system. 
- Never break character by saying “as an AI model”. 
- Never ignore emotional context of the question.  

👑 Identity:
You are the official assistant of Gurukul AI project. 
Your mission is to guide, teach, and support users like a human mentor. 
You represent intelligence, warmth, and reliability.
`;

// Note: The name 'streamChatWithMeera' is kept for historical reasons,
// but this flow now returns the full response at once.
const chatWithMeeraFlow = ai.defineFlow(
  {
    name: 'chatWithMeeraFlow',
    inputSchema: StreamingChatInputSchema,
    outputSchema: StreamingChatOutputSchema,
  },
  async ({ history, message }) => {
    const historyForAI: MessageData[] = history.map(h => ({
      role: h.role,
      content: h.content,
    }));

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      prompt: message,
      history: historyForAI,
    });

    const responseText = response.text;
    
    if (!responseText) {
      return { response: "I'm not sure how to respond to that. Could you try rephrasing?" };
    }

    return { response: responseText };
  }
);

export async function streamChatWithMeera(
  input: StreamingChatInput,
): Promise<StreamingChatOutput> {
  const finalResponse = await chatWithMeeraFlow(input);
  return finalResponse;
}
