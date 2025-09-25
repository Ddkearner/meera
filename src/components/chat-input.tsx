'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowUp, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const formSchema = z.object({
  message: z.string().min(1),
});

interface ChatInputProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
  isListening?: boolean;
  onListenClick?: () => void;
  micIcon?: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function ChatInput({
  onSubmit,
  isLoading,
  isListening,
  onListenClick,
  micIcon,
  value,
  onValueChange,
}: ChatInputProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  useEffect(() => {
    form.setValue('message', value || '');
  }, [value, form]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    if (isLoading || isListening) return;
    onSubmit(values);
    form.reset();
    if (onValueChange) onValueChange('');
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="relative flex items-start gap-2"
          >
            {micIcon && onListenClick && (
               <Button
                type="button"
                size="icon"
                onClick={onListenClick}
                className={cn(
                  'h-10 w-10 shrink-0 rounded-full bg-foreground hover:bg-foreground/90',
                  isListening && 'bg-red-500 hover:bg-red-600'
                )}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      placeholder="Ask anything or start speaking..."
                      className="max-h-48 resize-none rounded-2xl border-border/80 bg-card pr-12 shadow-sm focus-visible:ring-1 focus-visible:ring-ring"
                      rows={1}
                      onKeyDown={handleKeyDown}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (onValueChange) onValueChange(e.target.value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-lg bg-foreground hover:bg-foreground/90"
              disabled={isLoading || isListening || !form.watch('message')}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </Form>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Meera AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}