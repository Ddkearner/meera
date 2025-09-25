'use server';
import { streamChatWithMeera } from '@/ai/flows/chat';
import type { StreamingChatInput, StreamingChatOutput } from '@/lib/types';

export async function runChatFlow(
  input: StreamingChatInput
): Promise<StreamingChatOutput> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      response:
        'The AI is not configured. Please add the `GEMINI_API_KEY` to your environment variables.',
    };
  }

  if (!input.message.trim()) {
    throw new Error('Message cannot be empty.');
  }
  
  try {
    const result = await streamChatWithMeera(input);
    return result;
  } catch (e: any) {
    console.error('Error running chat flow:', e);
    return {
      response: 'An error occurred while communicating with the AI. Please check the server logs.',
    };
  }
}
