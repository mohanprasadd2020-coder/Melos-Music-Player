import { Song } from "@/lib/api";
import { X, Share2, ListPlus, Heart, Radio, Share } from "lucide-react";
import { toast } from "sonner";

interface RightPanelProps {
  song: Song | null;
  isFavorite: boolean;
  onAddToPlaylist: (song: Song) => void;
  onToggleFavorite: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onClose: () => void;
}

export default function RightPanel({
  song,
  isFavorite,
  onAddToPlaylist,
  onToggleFavorite,
  onAddToQueue,
  onClose,
}: RightPanelProps) {
  if (!song) return null;

  const handleShare = async () => {
    const text = `Check out "${song.name}" by ${song.artist}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.name,
          text: text,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="hidden lg:flex flex-col w-80 bg-card border-l border-border overflow-y-auto scrollbar-thin shadow-xl-deep">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-foreground">Now Playing</h3>
        <button
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-md hover:bg-secondary"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Song Details */}
      <div className="flex flex-col items-center gap-4 p-6">
        <img
          src={song.image || "/placeholder.svg"}
          alt={song.name}
          className="w-48 h-48 rounded-lg shadow-lg-card object-cover"
        />
        <div className="w-full text-center">
          <h2 className="text-lg font-bold text-foreground truncate">{song.name}</h2>
          <p className="text-sm text-muted-foreground mt-1 truncate">{song.artist}</p>
          {song.album && (
            <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{song.album}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 px-4 pb-4">
        <button
          onClick={() => onAddToPlaylist(song)}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-secondary transition-all duration-200 text-sm text-foreground hover:text-primary focus-ring"
          title="Add to playlist"
        >
          <ListPlus size={18} />
          <span>Add to playlist</span>
        </button>

        <button
          onClick={() => onToggleFavorite(song)}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 text-sm focus-ring ${
            isFavorite
              ? "text-primary hover:bg-primary/10"
              : "text-foreground hover:bg-secondary"
          }`}
          title={isFavorite ? "Remove from Liked Songs" : "Save to Liked Songs"}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          <span>{isFavorite ? "Remove from Liked Songs" : "Save to Liked Songs"}</span>
        </button>

        <button
          onClick={() => {
            onAddToQueue(song);
            toast.success("Added to queue");
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-secondary transition-all duration-200 text-sm text-foreground focus-ring"
          title="Add to queue"
        >
          <Radio size={18} />
          <span>Add to queue</span>
        </button>

        <a
          href={`#artist/${song.id}`}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-secondary transition-all duration-200 text-sm text-foreground text-left focus-ring"
          title="Go to artist"
        >
          <span className="text-lg">👤</span>
          <span>Go to artist</span>
        </a>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Metadata */}
      <div className="flex flex-col gap-3 p-4 text-xs bg-secondary/30">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Source</span>
          <span className="text-foreground font-medium capitalize">
            {song.source === "youtube" || song.source === "local" ? (song.source === "youtube" ? "YouTube" : "Local") : "JioSaavn"}
          </span>
        </div>

        {song.duration && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="text-foreground font-medium">
              {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, "0")}
            </span>
          </div>
        )}

        {song.album && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Album</span>
            <span className="text-foreground font-medium truncate text-right">{song.album}</span>
          </div>
        )}
      </div>

      {/* Share Button */}
      <div className="border-t border-border/50 p-4">
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 text-sm font-semibold shadow-md-elevated hover:shadow-lg-card focus-ring"
          title="Share"
        >
          <Share size={16} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
