'use server';
import { chatWithMeera, type ChatInput } from '@/ai/flows/chat';

export async function runChatFlow(input: ChatInput) {
  // Simple validation to ensure input is not empty
  if (!input.message.trim()) {
    throw new Error('Message cannot be empty.');
  }

  return await chatWithMeera(input);
}
