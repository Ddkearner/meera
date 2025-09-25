'use server';
import { streamChatWithMeera } from '@/ai/flows/chat';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import type { StreamingChatInput, StreamingChatOutput } from '@/lib/types';

export async function runChatFlow(
  input: StreamingChatInput
): Promise<StreamingChatOutput> {
  if (!input.message.trim()) {
    throw new Error('Message cannot be empty.');
  }
  // The 'streamChatWithMeera' function no longer streams, but it keeps the name
  // for consistency. It now fetches the full response.
  const result = await streamChatWithMeera(input);
  return result;
}


export async function runTextToSpeech(text: string) {
  if (!text.trim()) {
    throw new Error('Text cannot be empty.');
  }
  return await textToSpeech(text);
}
