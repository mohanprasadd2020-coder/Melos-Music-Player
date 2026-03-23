import { X, Play, Music } from "lucide-react";
import { Song } from "@/lib/api";

interface QueuePanelProps {
  open: boolean;
  onClose: () => void;
  queue: Song[];
  queueIndex: number;
  onPlayFromQueue: (index: number) => void;
}

export default function QueuePanel({ open, onClose, queue, queueIndex, onPlayFromQueue }: QueuePanelProps) {
  if (!open) return null;

  const upcoming = queue.slice(queueIndex + 1);
  const currentSong = queue[queueIndex];

  return (
    <div className="fixed right-0 top-0 bottom-[72px] w-80 bg-card border-l border-border z-40 flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">Queue</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {currentSong && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Now Playing</p>
            <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-accent">
              <img src={currentSong.image || "/placeholder.svg"} alt="" className="w-10 h-10 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary truncate">{currentSong.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
              </div>
              <Music size={14} className="text-primary shrink-0" />
            </div>
          </div>
        )}

        {upcoming.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Next Up</p>
            {upcoming.map((song, i) => {
              const realIndex = queueIndex + 1 + i;
              return (
                <button
                  key={`${song.id}-${realIndex}`}
                  onClick={() => onPlayFromQueue(realIndex)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors text-left group"
                >
                  <span className="w-5 text-xs text-muted-foreground text-center group-hover:hidden">{i + 1}</span>
                  <span className="w-5 hidden group-hover:flex items-center justify-center text-foreground">
                    <Play size={12} fill="currentColor" />
                  </span>
                  <img src={song.image || "/placeholder.svg"} alt="" className="w-9 h-9 rounded object-cover" />
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
    </div>
  );
}
