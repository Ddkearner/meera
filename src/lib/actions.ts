'use server';
import { streamChatWithMeera } from '@/ai/flows/chat';
import { runTts } from '@/ai/flows/tts';
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

export async function runTtsFlow(text: string): Promise<{ audio: string } | { error: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'AI is not configured.' };
  }
  try {
    const result = await runTts({ text });
    return result;
  } catch (e: any) {
    console.error('Error running TTS flow:', e);
    return { error: 'Failed to generate audio.' };
  }
}
