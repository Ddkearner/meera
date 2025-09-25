'use server';

import { ai } from '@/ai/genkit';
import type { MessageData } from 'genkit/generate';
import {
  ChatInputSchema,
  ChatOutputSchema,
  type ChatInput,
  type ChatOutput,
} from '@/lib/types';

const systemPrompt = `You are Meera, a friendly, encouraging, and helpful AI assistant for students. Your primary goal is to provide clear, concise, and accurate information. Always be supportive in your tone. When formatting responses, use simple markdown like lists, bolding, and italics, but avoid tables or complex structures.`;

const chatWithMeeraFlow = ai.defineFlow(
  {
    name: 'chatWithMeeraFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ history, message }) => {
    const model = ai.getModel('googleai/gemini-2.5-flash');

    const contents: MessageData[] = [
      ...history,
      { role: 'user', content: [{ text: message }] },
    ];

    const response = await model.generate({
      body: {
        contents,
        systemInstruction: {
          role: 'system',
          parts: [{ text: systemPrompt }],
        },
      },
    });

    const textResponse =
      response.candidates[0].message.content[0]?.text ??
      "I'm not sure how to respond to that. Could you try rephrasing?";

    return { response: textResponse };
  }
);

export async function chatWithMeera(input: ChatInput): Promise<ChatOutput> {
  return await chatWithMeeraFlow(input);
}
