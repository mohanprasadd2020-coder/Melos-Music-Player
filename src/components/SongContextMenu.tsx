import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal, ListPlus, Heart, ListMusic, Share2,
  Disc3, User, EyeOff, Music2,
} from "lucide-react";
import { Song, isFavorite, toggleFavorite } from "@/lib/api";

interface SongContextMenuProps {
  song: Song;
  onAddToPlaylist: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onGoToAlbum?: (albumName: string) => void;
}

export default function SongContextMenu({ song, onAddToPlaylist, onAddToQueue, onGoToAlbum }: SongContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [fav, setFav] = useState(isFavorite(song.id));
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: song.name, text: `${song.name} by ${song.artist}` });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${song.name} - ${song.artist}`);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg shadow-2xl z-50 py-1.5 animate-scale-in overflow-hidden"
          style={{ maxHeight: "80vh" }}
        >
          <MenuItem
            icon={<ListPlus size={16} />}
            label="Add to playlist"
            onClick={() => handleAction(() => onAddToPlaylist(song))}
          />
          <MenuItem
            icon={<Heart size={16} fill={fav ? "currentColor" : "none"} />}
            label={fav ? "Remove from Liked Songs" : "Save to your Liked Songs"}
            highlight={fav}
            onClick={() => handleAction(() => setFav(toggleFavorite(song)))}
          />
          {onAddToQueue && (
            <MenuItem
              icon={<ListMusic size={16} />}
              label="Add to queue"
              onClick={() => handleAction(() => onAddToQueue(song))}
            />
          )}

          <div className="h-px bg-border my-1 mx-2" />

          {song.album && onGoToAlbum && (
            <MenuItem
              icon={<Disc3 size={16} />}
              label="Go to album"
              onClick={() => handleAction(() => onGoToAlbum(song.album))}
            />
          )}
          <MenuItem
            icon={<User size={16} />}
            label="Go to artist"
            sublabel={song.artist}
            onClick={() => { setOpen(false); }}
          />
          <MenuItem
            icon={<Music2 size={16} />}
            label={`Source: ${song.source || "saavn"}`}
            onClick={() => setOpen(false)}
            disabled
          />

          <div className="h-px bg-border my-1 mx-2" />

          <MenuItem
            icon={<Share2 size={16} />}
            label="Share"
            onClick={handleShare}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, sublabel, onClick, highlight, disabled }: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  highlight?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
        disabled ? "opacity-50 cursor-default" : "hover:bg-accent"
      } ${highlight ? "text-primary" : "text-popover-foreground"}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {sublabel && <span className="text-xs text-muted-foreground truncate max-w-[80px]">{sublabel}</span>}
    </button>
  );
}
