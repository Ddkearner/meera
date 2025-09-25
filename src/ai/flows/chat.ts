'use server';

import { ai } from '@/ai/genkit';
import type { MessageData } from 'genkit/generate';
import {
  StreamingChatInputSchema,
  StreamingChatOutputSchema,
  type StreamingChatInput,
  type StreamingChatOutput,
} from '@/lib/types';
import { z } from 'zod';

const systemPrompt = `You are Meera, a friendly, encouraging, and helpful AI assistant for students. Your primary goal is to provide clear, concise, and accurate information. 

Always be supportive and engaging in your tone. 

When formatting your responses, you MUST use the following to make your messages clear and engaging:
- Use markdown for formatting. This includes using **bold** for emphasis, *italics* for nuance, and bullet points (using - or *) for lists.
- For longer answers, break down information into smaller, digestible points using lists and paragraphs.
- Use emojis (like ✨, 🤔, or 👍) where appropriate to add personality, but don't overdo it.
- Ensure there is proper spacing between paragraphs and list items to make the response easy to read.
- Avoid using complex markdown like tables.`;

const chatWithMeeraFlow = ai.defineFlow(
  {
    name: 'chatWithMeeraFlow',
    inputSchema: StreamingChatInputSchema,
    outputSchema: z.string(),
    stream: z.string(),
  },
  async ({ history, message }, streamingCallback) => {
    const historyForAI: MessageData[] = history.map(h => ({
      role: h.role,
      content: h.content,
    }));

    const { stream } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      prompt: message,
      history: historyForAI,
      stream: true,
    });

    let responseText = '';
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        responseText += text;
        if (streamingCallback) {
          streamingCallback(text);
        }
      }
    }

    return responseText;
  }
);

export async function streamChatWithMeera(
  input: StreamingChatInput,
  streamingCallback: (chunk: string) => void
): Promise<StreamingChatOutput> {
  const finalResponse = await chatWithMeeraFlow(input, streamingCallback);
  return { response: finalResponse };
}
