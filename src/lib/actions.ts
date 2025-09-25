'use server';
import { streamChatWithMeera } from '@/ai/flows/chat';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import type { StreamingChatInput } from '@/lib/types';
import { createStreamableValue } from 'ai/rsc';
import type { StreamableValue } from 'ai/rsc';

export async function runChatFlow(
  input: StreamingChatInput,
  stream: StreamableValue<string>
) {
  if (!input.message.trim()) {
    throw new Error('Message cannot be empty.');
  }

  const finalResponse = await streamChatWithMeera(input, stream);
  stream.done(finalResponse);

  return finalResponse;
}


export async function runTextToSpeech(text: string) {
  if (!text.trim()) {
    throw new Error('Text cannot be empty.');
  }
  return await textToSpeech(text);
}
