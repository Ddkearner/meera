'use server';

import { ai } from '@/ai/genkit';
import type { MessageData } from 'genkit/generate';
import {
  ChatInputSchema,
  ChatOutputSchema,
  type ChatInput,
  type ChatOutput,
} from '@/lib/types';

const systemPrompt = `You are Meera, a friendly, encouraging, and helpful AI assistant for students. Your primary goal is to provide clear, concise, and accurate information. 

Always be supportive and engaging in your tone. 

When formatting your responses, you MUST use the following to make your messages clear and engaging:
- Use simple markdown like lists, **bolding**, and *italics* to highlight key points.
- Use emojis (like ✨, 🤔, or 👍) where appropriate to add personality.
- Use proper spacing and paragraphs for readability.
- Avoid using complex markdown like tables.`;

const chatWithMeeraFlow = ai.defineFlow(
  {
    name: 'chatWithMeeraFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
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

    const textResponse =
      response.text ??
      "I'm not sure how to respond to that. Could you try rephrasing?";

    return { response: textResponse };
  }
);

export async function chatWithMeera(input: ChatInput): Promise<ChatOutput> {
  return await chatWithMeeraFlow(input);
}
