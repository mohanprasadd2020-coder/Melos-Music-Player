import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1,
  Shuffle, Repeat, Repeat1, ListMusic, ChevronDown, Heart, Music2, Loader2,
} from "lucide-react";
import { Song, isFavorite, toggleFavorite } from "@/lib/api";
import { RepeatMode } from "@/hooks/useAudioPlayer";
import { useState, useEffect } from "react";
import { fetchLyrics } from "@/lib/lyrics";

interface FullScreenPlayerProps {
  song: Song;
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
  onClose: () => void;
}

function fmt(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

type Tab = "player" | "lyrics" | "queue";

export default function FullScreenPlayer({
  song, isPlaying, currentTime, duration, volume,
  shuffle, repeat, queue, queueIndex,
  onTogglePlay, onNext, onPrev, onSeek, onVolumeChange,
  onToggleShuffle, onToggleRepeat, onPlayFromQueue, onClose,
}: FullScreenPlayerProps) {
  const [tab, setTab] = useState<Tab>("player");
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [fav, setFav] = useState(isFavorite(song.id));

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  // Fetch lyrics when song changes or lyrics tab opened
  useEffect(() => {
    setLyrics(null);
    if (tab === "lyrics") {
      setLyricsLoading(true);
      fetchLyrics(song.artist, song.name).then((l) => {
        setLyrics(l);
        setLyricsLoading(false);
      });
    }
  }, [song.id, tab]);

  useEffect(() => {
    setFav(isFavorite(song.id));
  }, [song.id]);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-slide-up">
      {/* Background gradient from album art */}
      <div
        className="absolute inset-0 opacity-30 blur-3xl scale-110"
        style={{
          backgroundImage: `url(${song.image || "/placeholder.svg"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown size={28} />
          </button>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-secondary/60 rounded-full p-1">
            {(["player", "lyrics", "queue"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors capitalize ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="w-10 h-10" />
        </div>

        {tab === "queue" ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-8 pb-4">
            <FullScreenQueue
              queue={queue}
              queueIndex={queueIndex}
              onPlayFromQueue={(i) => { onPlayFromQueue(i); setTab("player"); }}
            />
          </div>
        ) : tab === "lyrics" ? (
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 sm:px-12 pb-4">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <img src={song.image || "/placeholder.svg"} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{song.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
              </div>
              {lyricsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Searching lyrics...</p>
                </div>
              ) : lyrics ? (
                <pre className="text-sm sm:text-base text-foreground/90 whitespace-pre-wrap font-outfit leading-relaxed">
                  {lyrics}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Music2 className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Lyrics not available for this song</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Album art + song info */
          <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 gap-6 sm:gap-8 overflow-hidden">
            <div className="w-full max-w-[280px] sm:max-w-[340px] aspect-square">
              <img
                src={song.image || "/placeholder.svg"}
                alt={song.name}
                className={`w-full h-full rounded-2xl object-cover shadow-2xl ${isPlaying ? "animate-spin-slow" : ""}`}
                style={{ animationDuration: "20s" }}
              />
            </div>
            <div className="w-full max-w-[400px] text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">{song.name}</h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate">{song.artist}</p>
              {song.album && <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{song.album}</p>}
            </div>
          </div>
        )}

        {/* Controls area - always visible */}
        <div className="px-6 sm:px-12 pb-6 sm:pb-8 pt-2 space-y-3 max-w-[500px] mx-auto w-full">
          {/* Seek bar */}
          <div className="space-y-1">
            <div
              className="w-full h-1.5 bg-secondary rounded-full cursor-pointer group relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                onSeek(pct * duration);
              }}
            >
              <div
                className="h-full bg-primary rounded-full relative transition-all"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={onToggleShuffle}
              className={`transition-colors ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Shuffle size={20} />
            </button>
            <button onClick={onPrev} className="text-foreground hover:scale-110 transition-transform">
              <SkipBack size={28} fill="currentColor" />
            </button>
            <button
              onClick={onTogglePlay}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={onNext} className="text-foreground hover:scale-110 transition-transform">
              <SkipForward size={28} fill="currentColor" />
            </button>
            <button
              onClick={onToggleRepeat}
              className={`transition-colors ${repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <RepeatIcon size={20} />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 justify-center">
            <button
              onClick={() => onVolumeChange(volume === 0 ? 0.7 : 0)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <VolumeIcon size={18} />
            </button>
            <div
              className="w-28 sm:w-36 h-1.5 bg-secondary rounded-full cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onVolumeChange(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
              }}
            >
              <div
                className="h-full bg-foreground rounded-full group-hover:bg-primary transition-colors"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FullScreenQueue({ queue, queueIndex, onPlayFromQueue }: {
  queue: Song[];
  queueIndex: number;
  onPlayFromQueue: (i: number) => void;
}) {
  const currentSong = queue[queueIndex];
  const upcoming = queue.slice(queueIndex + 1);

  return (
    <div>
      {currentSong && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Now Playing</p>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent">
            <img src={currentSong.image || "/placeholder.svg"} alt="" className="w-12 h-12 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary truncate">{currentSong.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
          </div>
        </div>
      )}
      {upcoming.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Next Up</p>
          {upcoming.map((song, i) => {
            const realIndex = queueIndex + 1 + i;
            return (
              <button
                key={`${song.id}-${realIndex}`}
                onClick={() => onPlayFromQueue(realIndex)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left group"
              >
                <span className="w-6 text-xs text-muted-foreground text-center">{i + 1}</span>
                <img src={song.image || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{song.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No more songs in queue</p>
      )}
    </div>
  );
}
