import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1,
  Shuffle, Repeat, Repeat1, ListMusic, Sliders,
} from "lucide-react";
import { Song } from "@/lib/api";
import { RepeatMode } from "@/hooks/useAudioPlayer";
import { useAudioEffects } from "@/hooks/useAudioEffects";
import { useState } from "react";
import QueuePanel from "./QueuePanel";
import FullScreenPlayer from "./FullScreenPlayer";
import Equalizer from "./Equalizer";
import { Slider } from "./ui/slider";

interface PlayerProps {
  song: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  queue: Song[];
  queueIndex: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (t: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onPlayFromQueue: (index: number) => void;
  onReorderQueue: (fromIndex: number, toIndex: number) => void;
  onRemoveFromQueue: (index: number) => void;
}

function fmt(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MusicPlayer({
  song, isPlaying, currentTime, duration, volume,
  shuffle, repeat, queue, queueIndex, audioRef,
  onTogglePlay, onNext, onPrev, onSeek, onVolumeChange,
  onToggleShuffle, onToggleRepeat, onPlayFromQueue, onReorderQueue, onRemoveFromQueue,
}: PlayerProps) {
  const [showQueue, setShowQueue] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);

  // Initialize audio effects at player level so they persist
  const audioEffects = useAudioEffects(audioRef, volume);

  if (!song) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 h-[72px] bg-player-bg border-t border-border z-50 flex items-center justify-center shadow-xl-deep">
        <p className="text-muted-foreground text-sm">Select a song to start playing</p>
      </footer>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <>
      {/* Full screen player */}
      {showFullScreen && (
        <FullScreenPlayer
          song={song}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          shuffle={shuffle}
          repeat={repeat}
          queue={queue}
          queueIndex={queueIndex}
          onTogglePlay={onTogglePlay}
          onNext={onNext}
          onPrev={onPrev}
          onSeek={onSeek}
          onVolumeChange={onVolumeChange}
          onToggleShuffle={onToggleShuffle}
          onToggleRepeat={onToggleRepeat}
          onPlayFromQueue={onPlayFromQueue}
          onReorderQueue={onReorderQueue}
          onRemoveFromQueue={onRemoveFromQueue}
          onClose={() => setShowFullScreen(false)}
        />
      )}

      {/* Desktop queue panel */}
      <QueuePanel
        open={showQueue && !showFullScreen}
        onClose={() => setShowQueue(false)}
        queue={queue}
        queueIndex={queueIndex}
        onPlayFromQueue={onPlayFromQueue}
        onReorderQueue={onReorderQueue}
        onRemoveFromQueue={onRemoveFromQueue}
      />

      {/* Equalizer panel */}
      {showEqualizer && <Equalizer {...audioEffects} />}

      {/* Mini player bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-[72px] bg-player-bg border-t border-border z-50 flex items-center px-3 sm:px-4 gap-2 sm:gap-4 shadow-xl-deep">
        {/* Song info — tap to open full screen */}
        <button
          onClick={() => setShowFullScreen(true)}
          className="flex items-center gap-3 w-[140px] sm:w-[200px] min-w-0 shrink-0 text-left hover:opacity-80 transition-opacity duration-200 rounded-lg p-1 hover:bg-secondary/50"
        >
          <img
            src={song.image || "/placeholder.svg"}
            alt=""
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-md object-cover shadow-md-elevated ${isPlaying ? "animate-spin-slow" : ""}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{song.name}</p>
            <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
          </div>
        </button>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-1 max-w-[600px] mx-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onToggleShuffle}
              className={`hidden sm:block transition-colors duration-200 rounded-md p-1 hover:bg-secondary ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Shuffle"
            >
              <Shuffle size={16} />
            </button>
            <button onClick={onPrev} className="text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md p-1 hover:bg-secondary" title="Previous track">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-md-elevated"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={onNext} className="text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md p-1 hover:bg-secondary" title="Next track">
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button
              onClick={onToggleRepeat}
              className={`hidden sm:block transition-colors duration-200 rounded-md p-1 hover:bg-secondary ${repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title={`Repeat: ${repeat}`}
            >
              <RepeatIcon size={16} />
            </button>
          </div>
          {/* Seek bar - hidden on very small screens, shown on sm+ */}
          <div className="w-full hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-10 text-right tabular-nums">{fmt(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={([val]) => onSeek(val)}
              className="flex-1 cursor-pointer"
            />
            <span className="w-10 tabular-nums">{fmt(duration)}</span>
          </div>
          {/* Mobile progress bar (thin, no timestamps) */}
          <progress
            value={progress}
            max={100}
            className="player-progress w-full sm:hidden"
            aria-label="Playback progress"
          />
        </div>

        {/* Right controls — all screens */}
        <div className="flex items-center gap-1 sm:gap-2 w-auto sm:w-[160px] shrink-0 sm:justify-end">
          <button
            onClick={() => setShowEqualizer(!showEqualizer)}
            className={`transition-colors duration-200 rounded-md p-1 hover:bg-secondary ${showEqualizer ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title="Equalizer"
          >
            <Sliders size={16} className="sm:hidden" />
            <Sliders size={18} className="hidden sm:block" />
          </button>
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`transition-colors duration-200 rounded-md p-1 hover:bg-secondary ${showQueue ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title="Queue"
          >
            <ListMusic size={16} className="sm:hidden" />
            <ListMusic size={18} className="hidden sm:block" />
          </button>
          <button onClick={() => onVolumeChange(volume === 0 ? 0.7 : 0)} className="text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md p-1 hover:bg-secondary" title="Mute/unmute">
            <VolumeIcon size={16} className="sm:hidden" />
            <VolumeIcon size={18} className="hidden sm:block" />
          </button>
          <div className="w-16 sm:w-24 group hidden sm:block">
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={([val]) => onVolumeChange(val)}
              className="cursor-pointer"
            />
          </div>
        </div>
      </footer>
    </>
  );
}
