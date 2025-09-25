'use server';
import { chatWithMeera } from '@/ai/flows/chat';
import type { ChatInput } from '@/lib/types';

export async function runChatFlow(input: ChatInput) {
  // Simple validation to ensure input is not empty
  if (!input.message.trim()) {
    throw new Error('Message cannot be empty.');
  }

  return await chatWithMeera(input);
}
