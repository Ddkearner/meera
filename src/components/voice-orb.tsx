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
    </div>
  );
}
