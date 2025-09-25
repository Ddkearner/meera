'use client';

import { cn } from "@/lib/utils";

interface VoiceOrbProps {
  transcript: string;
  isListening: boolean;
}

export function VoiceOrb({ transcript, isListening }: VoiceOrbProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-48 w-48 md:h-64 md:w-64">
        <div className={cn(
          "absolute inset-0 rounded-full meera-gradient transition-all duration-500",
          isListening ? "animate-pulse-slow blur-2xl" : "blur-xl"
        )}></div>
        <div className={cn(
          "absolute inset-4 rounded-full meera-gradient transition-all duration-500",
          isListening ? "animate-pulse-medium blur-xl" : "blur-lg"
        )}></div>
        <div className={cn(
          "absolute inset-8 rounded-full meera-gradient transition-all duration-500",
           isListening ? "" : "opacity-80"
        )}></div>
      </div>
       <p className="mt-8 text-2xl font-semibold text-foreground h-8">
        {isListening && transcript ? '...' : (isListening ? 'Listening...' : 'Click anywhere to speak')}
      </p>
      {isListening && (
        <p className="mt-4 max-w-xl text-center text-lg text-muted-foreground min-h-[56px]">
          {transcript}
        </p>
      )}
    </div>
  );
}
