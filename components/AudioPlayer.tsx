import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { decodeAudioData } from '../utils/audioUtils';

interface AudioPlayerProps {
  base64Audio: string | null;
  onEnded: () => void;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64Audio, onEnded, className }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Audio Context and Decode
  useEffect(() => {
    const initAudio = async () => {
      if (!base64Audio) return;

      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = ctx;
        gainNodeRef.current = ctx.createGain();
        gainNodeRef.current.connect(ctx.destination);

        const buffer = await decodeAudioData(base64Audio, ctx);
        audioBufferRef.current = buffer;
        setDuration(buffer.duration);
        setIsReady(true);
      } catch (err) {
        console.error("Audio decoding failed", err);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [base64Audio]);

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceNodeRef.current = null;
    }
  }, []);

  const updateProgress = useCallback(() => {
    if (!audioContextRef.current || !isPlaying) return;

    const ctx = audioContextRef.current;
    const elapsed = ctx.currentTime - startTimeRef.current + pauseTimeRef.current;
    
    if (elapsed >= duration) {
        setIsPlaying(false);
        setProgress(100);
        setCurrentTime(duration);
        pauseTimeRef.current = 0; // Reset for replay
        stopAudio();
        onEnded();
    } else {
        setCurrentTime(elapsed);
        setProgress((elapsed / duration) * 100);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [duration, isPlaying, onEnded, stopAudio]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isPlaying, updateProgress]);

  const togglePlay = async () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;
    const ctx = audioContextRef.current;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (isPlaying) {
      // Pause
      stopAudio();
      pauseTimeRef.current += ctx.currentTime - startTimeRef.current;
      setIsPlaying(false);
    } else {
      // Play
      const source = ctx.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(gainNodeRef.current!);
      
      // If we reached the end, restart
      if (currentTime >= duration) {
        pauseTimeRef.current = 0;
        setCurrentTime(0);
        setProgress(0);
      }

      startTimeRef.current = ctx.currentTime;
      source.start(0, pauseTimeRef.current);
      sourceNodeRef.current = source;
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
     stopAudio();
     setIsPlaying(false);
     pauseTimeRef.current = 0;
     setCurrentTime(0);
     setProgress(0);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isReady) {
      return (
          <div className={`flex items-center justify-center p-4 bg-gray-100 rounded-lg animate-pulse ${className}`}>
              <span className="text-gray-500 text-sm font-medium">Loading Audio...</span>
          </div>
      );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4 ${className}`}>
      {/* Visualizer / Progress Bar */}
      <div className="relative w-full h-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
         {/* Simple background waveform simulation */}
         <div className="absolute inset-0 flex items-center justify-center opacity-10 gap-1">
             {Array.from({ length: 40 }).map((_, i) => (
                 <div key={i} className="w-1 bg-slate-900 rounded-full" style={{ height: `${Math.random() * 80 + 20}%`}}></div>
             ))}
         </div>

         {/* Active Progress Overlay */}
         <div 
            className="absolute left-0 top-0 bottom-0 bg-blue-500/20 border-r-2 border-blue-600 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
         />
         
         <div className="z-10 font-mono text-slate-700 font-medium text-lg">
            {formatTime(currentTime)} / {formatTime(duration)}
         </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button 
            onClick={handleRestart}
            className="p-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
            title="Restart"
        >
            <RotateCcw size={20} />
        </button>

        <button
          onClick={togglePlay}
          className="w-16 h-16 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1"/>}
        </button>

        <div className="w-12"></div> {/* Spacer for symmetry */}
      </div>
    </div>
  );
};