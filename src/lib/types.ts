import { z } from 'zod';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const ChatHistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

export const StreamingChatInputSchema = z.object({
  history: z.array(ChatHistoryMessageSchema),
  message: z.string(),
});
export type StreamingChatInput = z.infer<typeof StreamingChatInputSchema>;

export const StreamingChatOutputSchema = z.object({
  response: z.string(),
});
export type StreamingChatOutput = z.infer<typeof StreamingChatOutputSchema>;
