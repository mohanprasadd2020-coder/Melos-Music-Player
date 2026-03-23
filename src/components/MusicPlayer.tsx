import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1,
} from "lucide-react";
import { Song } from "@/lib/api";

interface PlayerProps {
  song: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (t: number) => void;
  onVolumeChange: (v: number) => void;
}

function fmt(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MusicPlayer({
  song, isPlaying, currentTime, duration, volume,
  onTogglePlay, onNext, onPrev, onSeek, onVolumeChange,
}: PlayerProps) {
  if (!song) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 h-[72px] bg-player-bg border-t border-border z-50 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a song to start playing</p>
      </footer>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[72px] bg-player-bg border-t border-border z-50 flex items-center px-4 gap-4">
      {/* Song info */}
      <div className="flex items-center gap-3 w-[200px] min-w-0 shrink-0">
        <img
          src={song.image || "/placeholder.svg"}
          alt=""
          className={`w-12 h-12 rounded object-cover shadow-md ${isPlaying ? "animate-spin-slow" : ""}`}
          style={{ animationDuration: "8s" }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{song.name}</p>
          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-[600px] mx-auto">
        <div className="flex items-center gap-4">
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
        </div>
        <div className="w-full flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-10 text-right">{fmt(currentTime)}</span>
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
          <span className="w-10">{fmt(duration)}</span>
        </div>
      </div>

      {/* Volume - hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2 w-[140px] shrink-0 justify-end">
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
  );
}
