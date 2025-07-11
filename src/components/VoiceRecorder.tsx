import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, X, Send, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
  onSend: (audioData: { url: string; duration: number; size: number }) => void;
  onCancel: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setHasRecording(true);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setHasRecording(false);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSend = () => {
    if (audioUrl && hasRecording) {
      // Convert blob URL to data URL for storage
      fetch(audioUrl)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = () => {
            onSend({
              url: reader.result as string,
              duration: duration,
              size: blob.size
            });
          };
          reader.readAsDataURL(blob);
        });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-lg border-b border-white/10 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-semibold text-white">Voice Message</h2>
              <p className="text-sm text-white/60">
                {isRecording ? 'Recording...' : hasRecording ? 'Recording ready' : 'Tap to record'}
              </p>
            </div>
          </div>
          
          {hasRecording && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resetRecording}
              className="text-white hover:bg-white/20"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Recording Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {!hasRecording ? (
          // Recording State
          <div className="text-center space-y-8">
            <div className="relative">
              <Button
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-32 h-32 rounded-full ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                {isRecording ? (
                  <Square className="h-12 w-12" />
                ) : (
                  <Mic className="h-12 w-12" />
                )}
              </Button>
              
              {isRecording && (
                <div className="absolute -inset-4 border-4 border-red-500/30 rounded-full animate-ping"></div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-mono text-white">
                {formatTime(duration)}
              </div>
              <p className="text-white/60">
                {isRecording ? 'Tap to stop recording' : 'Hold to record or tap to start'}
              </p>
            </div>
          </div>
        ) : (
          // Playback State
          <div className="text-center space-y-8 w-full max-w-md">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <div className="text-4xl">🎵</div>
            </div>
            
            <div className="space-y-4">
              <div className="text-xl font-mono text-white">
                {formatTime(Math.floor(currentTime))} / {formatTime(duration)}
              </div>
              
              {/* Waveform placeholder */}
              <div className="flex items-center justify-center space-x-1 h-16">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-purple-400 rounded-full transition-all"
                    style={{
                      height: `${Math.random() * 40 + 10}px`,
                      opacity: isPlaying ? (Math.random() > 0.5 ? 1 : 0.3) : 0.3
                    }}
                  />
                ))}
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isPlaying ? pauseRecording : playRecording}
                  className="text-white hover:bg-white/20 w-16 h-16 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send Button */}
      {hasRecording && (
        <div className="bg-black/80 backdrop-blur-lg border-t border-white/10 p-4 flex-shrink-0">
          <Button
            onClick={handleSend}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
          >
            <Send className="h-5 w-5 mr-2" />
            Send Voice Message
          </Button>
        </div>
      )}

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(Math.floor(audioRef.current.duration));
            }
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}
    </div>
  );
};

export default VoiceRecorder;