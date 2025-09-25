'use server';
import { streamChatWithMeera } from '@/ai/flows/chat';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import type { StreamingChatInput } from '@/lib/types';

export async function runChatFlow(input: StreamingChatInput, onChunk: (chunk: string) => void) {
  if (!input.message.trim()) {
    throw new Error('Message cannot be empty.');
  }

  // Since server actions can't directly stream to the client component,
  // we use the callback to handle chunks. The final response is still returned.
  return await streamChatWithMeera(input, onChunk);
}


export async function runTextToSpeech(text: string) {
  if (!text.trim()) {
    throw new Error('Text cannot be empty.');
  }
  return await textToSpeech(text);
}
