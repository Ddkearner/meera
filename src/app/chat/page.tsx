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
  const isMounted = useRef(false);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
         console.log("Speech recognition could not start, likely already active or an error occurred.");
      }
    }
  }, [isListening]);

  const handleSendMessage = async (values: { message: string }) => {
    if (!values.message.trim()) {
        return;
    };

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
      if (audioResponse?.media && audioRef.current) {
          audioRef.current.src = audioResponse.media;
          audioRef.current.play();
          audioRef.current.onended = () => {
             startListening();
          };
      } else {
        startListening();
      }
    } catch (error) {
      console.error('Error calling AI flow:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
      });
      startListening();
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    if (typeof window === 'undefined') return;
    
    if (!audioRef.current) {
        audioRef.current = new Audio();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

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
        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = event => {
        if (event.error === 'not-allowed') {
          toast({
            variant: 'destructive',
            title: 'Microphone Access Denied',
            description: 'Please allow microphone access in your browser settings to use voice features.',
          });
        } else if (event.error === 'aborted' || event.error === 'no-speech') {
          console.log(`Speech recognition stopped gracefully: ${event.error}`);
        } else {
          console.error('Speech recognition error:', event.error);
          toast({
            variant: 'destructive',
            title: 'Recognition Error',
            description: `An audio error occurred. Please try again. (${event.error})`,
          });
        }
        setIsListening(false);
      };
      
      recognition.onstart = () => {
          setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTranscript(currentTranscript => {
            if (currentTranscript.trim() && !isLoading) {
                handleSendMessage({ message: currentTranscript.trim() });
            }
            return currentTranscript;
        });
      };
      
      recognitionRef.current = recognition;
      startListening();
    } else {
       toast({
          variant: 'destructive',
          title: 'Browser Not Supported',
          description: 'Speech recognition is not supported in your browser.',
       });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const WelcomeScreen = () => (
    <div className="flex h-full flex-col items-center justify-center text-center p-4">
      <div onClick={isListening ? stopListening : startListening}>
        <VoiceOrb transcript={transcript} isListening={isListening} />
      </div>
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

  const activateListening = () => {
    if (!isLoading && !isListening) {
      startListening();
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader />
      <main className="flex-1 overflow-y-auto" onClick={activateListening}>
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
        onMicrophoneClick={isListening ? stopListening : startListening}
      />
    </div>
  );
}
