'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatHeader } from '@/components/chat-header';
import { ChatInput } from '@/components/chat-input';
import { ChatMessages } from '@/components/chat-messages';
import { runChatFlow, runTextToSpeech } from '@/lib/actions';
import type { ChatMessage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { VoiceOrb } from '@/components/voice-orb';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // onend will set isListening to false
    }
  }, []);

  const handleSendMessage = async (values: { message: string }) => {
    if (!values.message.trim()) return;

    stopListening();

    const userMessage: ChatMessage = { role: 'user', content: values.message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setTranscript('');

    try {
      const historyForAI = newMessages.slice(0, -1).map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.content }],
      }));

      const response = await runChatFlow({
        history: historyForAI,
        message: values.message,
      });

      const modelMessage: ChatMessage = {
        role: 'model',
        content: response.response,
      };
      setMessages(prev => [...prev, modelMessage]);

      const audioResponse = await runTextToSpeech(response.response);
      if (audioResponse?.media) {
        if (audioRef.current) {
          audioRef.current.src = audioResponse.media;
          audioRef.current.play();
          // After speaking, start listening again
          audioRef.current.onended = () => {
             startListening();
          };
        }
      } else {
        // If no audio, start listening again
        startListening();
      }
    } catch (error) {
      console.error('Error calling AI flow:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
      });
      // Do not remove the user message on error
       startListening(); // Start listening again on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        recognitionRef.current.start();
        // onstart will set isListening to true
      } catch (error) {
         // This can happen if recognition is already starting, e.g. on fast re-renders
         console.log("Speech recognition could not start, likely already starting.");
      }
    }
  }, [isListening]);


  useEffect(() => {
    if (typeof window !== 'undefined' && !recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false; // Set to false to auto-detect end of speech

        recognition.onresult = event => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTranscript(finalTranscript + interimTranscript);
        };

        recognition.onerror = event => {
          if (event.error === 'aborted' || event.error === 'no-speech') {
            console.log(`Speech recognition stopped: ${event.error}`);
            // Don't show toast for these common cases, just restart listening
            if (!isLoading) {
              // Ensure we don't restart if a message is being sent
               startListening();
            }
            return;
          }
          console.error('Speech recognition error:', event.error);
          toast({
            variant: 'destructive',
            title: 'Recognition Error',
            description: `Could not understand audio. Please try again. (${event.error})`,
          });
        };
        
        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
          setIsListening(false);
          // Only send if there is a final transcript and we are not in the middle of a submission
          if (transcript.trim() && !isLoading) {
             handleSendMessage({ message: transcript.trim() });
          } else if (!isLoading) {
            // If there's no transcript, just start listening again
            startListening();
          }
        };
        
        recognitionRef.current = recognition;
        startListening(); // Start listening on initial mount
      } else {
         toast({
            variant: 'destructive',
            title: 'Browser Not Supported',
            description: 'Speech recognition is not supported in your browser.',
         });
      }
    }

    if (!audioRef.current) {
        audioRef.current = new Audio();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const WelcomeScreen = () => (
    <div className="flex h-full flex-col items-center justify-center text-center p-4"  onClick={startListening}>
      <VoiceOrb transcript={transcript} isListening={isListening} />
       {!isListening && !transcript && (
         <h2 className="mt-8 text-2xl font-semibold text-gray-700">How can I help you today?</h2>
       )}
       {isListening && !transcript && (
         <p className="mt-8 text-2xl font-semibold text-foreground h-8">Listening...</p>
       )}
        <p className="mt-4 max-w-xl text-center text-lg text-muted-foreground min-h-[56px]">
          {transcript}
        </p>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader />
      <main className="flex-1 overflow-y-auto" onClick={!isLoading && !isListening ? startListening : undefined}>
         {messages.length === 0 && !isLoading ? (
           <WelcomeScreen />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
      </main>
      <ChatInput
        onSubmit={handleSendMessage}
        isLoading={isLoading}
        value={transcript}
        onValueChange={setTranscript}
        isListening={isListening}
      />
    </div>
  );
}
