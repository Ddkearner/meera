'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

const formSchema = z.object({
  message: z.string().min(1),
});

interface ChatInputProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    form.reset();
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.handleSubmit(handleFormSubmit)();
    }
  };

  return (
    <div className="w-full shrink-0 border-t bg-background px-4 py-3 md:px-6">
       <div className="absolute bottom-full left-0 w-full h-20 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
      <div className="mx-auto max-w-3xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="relative flex items-start"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      placeholder="Ask anything..."
                      className="max-h-48 resize-none rounded-2xl border-border/80 bg-card pr-12 shadow-sm focus-visible:ring-1 focus-visible:ring-ring"
                      rows={1}
                      onKeyDown={handleKeyDown}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-lg bg-foreground hover:bg-foreground/90"
              disabled={isLoading || !form.watch('message')}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </Form>
        <p className="text-center text-xs text-muted-foreground mt-2">ChatGPT can make mistakes. Check important info.</p>
      </div>
    </div>
  );
}
