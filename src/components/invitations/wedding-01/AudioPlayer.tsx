
import React, { useRef, useState } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <audio ref={audioRef} src="/placeholder-audio.mp3" loop />
      <button onClick={togglePlay} className="bg-gold-gradient text-maroon p-2 rounded-full shadow-lg">
        <Music className={isPlaying ? 'animate-pulse' : ''} />
      </button>
      <button onClick={toggleMute} className="bg-gold-gradient text-maroon p-2 rounded-full shadow-lg">
        {isMuted ? <VolumeX /> : <Volume2 />}
      </button>
    </div>
  );
};

export default AudioPlayer;
