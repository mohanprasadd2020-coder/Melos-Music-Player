import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1,
  Shuffle, Repeat, Repeat1, ListMusic,
} from "lucide-react";
import { Song } from "@/lib/api";
import { RepeatMode } from "@/hooks/useAudioPlayer";
import { useState } from "react";
import QueuePanel from "./QueuePanel";
import FullScreenPlayer from "./FullScreenPlayer";

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
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (t: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onPlayFromQueue: (index: number) => void;
}

function fmt(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MusicPlayer({
  song, isPlaying, currentTime, duration, volume,
  shuffle, repeat, queue, queueIndex,
  onTogglePlay, onNext, onPrev, onSeek, onVolumeChange,
  onToggleShuffle, onToggleRepeat, onPlayFromQueue,
}: PlayerProps) {
  const [showQueue, setShowQueue] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  if (!song) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 h-[72px] bg-player-bg border-t border-border z-50 flex items-center justify-center">
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
      />

      {/* Mini player bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-[72px] bg-player-bg border-t border-border z-50 flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
        {/* Song info — tap to open full screen */}
        <button
          onClick={() => setShowFullScreen(true)}
          className="flex items-center gap-3 w-[140px] sm:w-[200px] min-w-0 shrink-0 text-left hover:opacity-80 transition-opacity"
        >
          <img
            src={song.image || "/placeholder.svg"}
            alt=""
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-md object-cover shadow-md ${isPlaying ? "animate-spin-slow" : ""}`}
            style={{ animationDuration: "8s" }}
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
              className={`hidden sm:block transition-colors ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Shuffle"
            >
              <Shuffle size={16} />
            </button>
            <button onClick={onPrev} className="text-muted-foreground hover:text-foreground transition-colors">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={onNext} className="text-muted-foreground hover:text-foreground transition-colors">
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button
              onClick={onToggleRepeat}
              className={`hidden sm:block transition-colors ${repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title={`Repeat: ${repeat}`}
            >
              <RepeatIcon size={16} />
            </button>
          </div>
          {/* Seek bar - hidden on very small screens, shown on sm+ */}
          <div className="w-full hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-10 text-right tabular-nums">{fmt(currentTime)}</span>
            <div className="flex-1 h-1 bg-secondary rounded-full group cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                onSeek(pct * duration);
              }}
            >
              <div
                className="h-full bg-foreground rounded-full relative group-hover:bg-primary transition-colors"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="w-10 tabular-nums">{fmt(duration)}</span>
          </div>
          {/* Mobile progress bar (thin, no timestamps) */}
          <div className="w-full sm:hidden h-0.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Right controls — desktop only */}
        <div className="hidden sm:flex items-center gap-2 w-[160px] shrink-0 justify-end">
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={`transition-colors ${showQueue ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title="Queue"
          >
            <ListMusic size={18} />
          </button>
          <button onClick={() => onVolumeChange(volume === 0 ? 0.7 : 0)} className="text-muted-foreground hover:text-foreground transition-colors">
            <VolumeIcon size={18} />
          </button>
          <div
            className="w-20 h-1 bg-secondary rounded-full cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onVolumeChange(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
            }}
          >
            <div className="h-full bg-foreground rounded-full group-hover:bg-primary transition-colors" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>
      </footer>
    </>
  );
}
