'use client';

interface VoiceOrbProps {
  transcript: string;
}

export function VoiceOrb({ transcript }: VoiceOrbProps) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative h-64 w-64">
        <div className="absolute inset-0 animate-pulse-slow rounded-full meera-gradient blur-2xl"></div>
        <div className="absolute inset-4 animate-pulse-medium rounded-full meera-gradient blur-xl"></div>
        <div className="absolute inset-8 rounded-full meera-gradient"></div>
      </div>
      <p className="mt-8 text-2xl font-semibold text-foreground">Listening...</p>
      <p className="mt-4 max-w-xl text-center text-lg text-muted-foreground">
        {transcript}
      </p>
    </div>
  );
}
