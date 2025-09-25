'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowUp, Mic, MicOff } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { VoiceOrb } from './voice-orb';

const formSchema = z.object({
  message: z.string().min(1),
});

interface ChatInputProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  isListening?: boolean;
  onMicrophoneClick: () => void;
}

export function ChatInput({
  onSubmit,
  isLoading,
  value,
  onValueChange,
  isListening,
  onMicrophoneClick,
}: ChatInputProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isManuallyTyping = useRef(false);

  useEffect(() => {
    // Only update form value if user is not manually typing
    if (!isManuallyTyping.current) {
      form.setValue('message', value || '');
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, form]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    if (isLoading) return;
    onSubmit(values);
    form.reset();
    if (onValueChange) onValueChange('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    isManuallyTyping.current = false;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    isManuallyTyping.current = true;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.handleSubmit(handleFormSubmit)();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    isManuallyTyping.current = true;
    form.setValue('message', e.target.value);
    if (onValueChange) {
      onValueChange(e.target.value);
    }
  }

  return (
    <div className="w-full shrink-0 border-t bg-background px-4 py-3 md:px-6">
      <div className="absolute bottom-full left-0 h-20 w-full bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
      <div className="mx-auto max-w-3xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="relative flex items-start gap-2"
          >
            <div className="flex h-10 items-center justify-center">
              <div onClick={onMicrophoneClick} className="cursor-pointer">
                 <VoiceOrb isListening={!!isListening} className="h-8 w-8" />
              </div>
            </div>
            <div className={cn(
              "flex-1 relative",
              isListening && value && !isManuallyTyping.current && "listening-input-wrapper"
            )}>
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        ref={textareaRef}
                        placeholder="Ask anything or start speaking..."
                        className="max-h-48 resize-none rounded-2xl border-border/80 bg-card pr-12 shadow-sm focus-visible:ring-1 focus-visible:ring-ring pl-4"
                        rows={1}
                        onKeyDown={handleKeyDown}
                        {...field}
                        onChange={handleInputChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="absolute bottom-1.5 right-1.5 flex items-center z-10">
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-lg bg-foreground hover:bg-foreground/90"
                disabled={isLoading || !form.watch('message')}
              >
                <ArrowUp className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        </Form>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Meera AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
