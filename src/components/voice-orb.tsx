'use client';

import { cn } from "@/lib/utils";

interface VoiceOrbProps {
  isListening: boolean;
  className?: string;
}

export function VoiceOrb({ isListening, className }: VoiceOrbProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative h-full w-full">
        <div className={cn(
          "absolute inset-0 rounded-full meera-gradient transition-all duration-500",
          isListening ? "animate-pulse-slow blur-xl" : "blur-lg opacity-70"
        )}></div>
        <div className={cn(
          "absolute inset-[15%] rounded-full meera-gradient transition-all duration-500",
          isListening ? "animate-pulse-medium blur-md" : "blur-sm opacity-80"
        )}></div>
        <div className={cn(
          "absolute inset-[25%] rounded-full meera-gradient transition-all duration-500",
           isListening ? "" : "opacity-90"
        )}></div>
      </div>
    </div>
  );
}
