'use server';
import { chatWithMeera } from '@/ai/flows/chat';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import type { ChatInput } from '@/lib/types';

export async function runChatFlow(input: ChatInput) {
  // Simple validation to ensure input is not empty
  if (!input.message.trim()) {
    throw new Error('Message cannot be empty.');
  }

  return await chatWithMeera(input);
}

export async function runTextToSpeech(text: string) {
  if (!text.trim()) {
    throw new Error('Text cannot be empty.');
  }
  return await textToSpeech(text);
}
