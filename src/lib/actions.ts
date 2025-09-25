'use server';
import { streamChatWithMeera } from '@/ai/flows/chat';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import type { StreamingChatInput } from '@/lib/types';
import { createStreamableValue } from 'ai/rsc';
import type { StreamableValue } from 'ai/rsc';

export async function runChatFlow(
  input: StreamingChatInput
): Promise<{ stream: StreamableValue<string> }> {
  if (!input.message.trim()) {
    throw new Error('Message cannot be empty.');
  }
  
  const stream = createStreamableValue('');
  
  // Do not await here. The client needs the stream reference immediately.
  // The work will happen in the background.
  (async () => {
    try {
      const finalResponse = await streamChatWithMeera(input, stream);
      // stream.done() is called inside streamChatWithMeera
    } catch (e) {
      console.error('Error in streamChatWithMeera background task:', e);
      stream.done(); // Ensure stream is closed on error
    }
  })();

  return { stream: stream.value };
}


export async function runTextToSpeech(text: string) {
  if (!text.trim()) {
    throw new Error('Text cannot be empty.');
  }
  return await textToSpeech(text);
}
