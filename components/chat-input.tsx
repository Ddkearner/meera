'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowUp, Mic } from 'lucide-react';
import { useEffect, useRef } from 'react';

const formSchema = z.object({
  message: z.string().min(1),
});

interface ChatInputProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
}

export function ChatInput({
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [form.watch('message')]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    if (isLoading) return;
    onSubmit(values);
    form.reset();
     if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.handleSubmit(handleFormSubmit)();
    }
  };

  return (
    <div className="w-full shrink-0 border-t bg-background px-4 py-3 md:px-6">
       <div className="absolute bottom-full left-0 h-20 w-full bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
      <div className="mx-auto max-w-3xl">
        <label className="text-sm font-medium text-foreground mb-1 ml-1 block">Jay Krishna</label>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="relative flex items-end gap-2"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      ref={textareaRef}
                      placeholder="Ask anything..."
                      className="max-h-48 resize-none rounded-2xl border-border/80 bg-card pr-14 shadow-sm focus-visible:ring-1 focus-visible:ring-ring pl-4"
                      rows={1}
                      onKeyDown={handleKeyDown}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="absolute bottom-1.5 right-1.5 flex items-center z-10">
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 rounded-full bg-foreground hover:bg-foreground/90"
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
