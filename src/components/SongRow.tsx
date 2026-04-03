import { Play, Heart } from "lucide-react";
import { Song, isFavorite, toggleFavoriteForUser } from "@/lib/api";
import { useState } from "react";
import SongContextMenu from "./SongContextMenu";
import { useAuth } from "@/hooks/useAuth";

interface SongRowProps {
  song: Song;
  index: number;
  isActive: boolean;
  onPlay: () => void;
  onAddToPlaylist?: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onRemoveFromPlaylist?: (songId: string) => void;
  userId?: string;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function SongRow({ song, index, isActive, onPlay, onAddToPlaylist, onAddToQueue, onRemoveFromPlaylist, userId }: SongRowProps) {
  const [fav, setFav] = useState(isFavorite(song.id));

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setFav(!fav);
    const result = await toggleFavoriteForUser(song, userId);
    setFav(result);
  };

  return (
    <div
      onClick={onPlay}
      className={`group flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer transition-colors ${
        isActive ? "bg-accent" : "hover:bg-accent/50"
      }`}
    >
      <div className="w-8 text-center text-sm text-muted-foreground group-hover:hidden">
        {index + 1}
      </div>
      <div className="w-8 hidden group-hover:flex items-center justify-center text-foreground">
        <Play size={14} fill="currentColor" />
      </div>
      <img src={song.image || "/placeholder.svg"} alt="" className="w-10 h-10 rounded object-cover" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : "text-foreground"}`}>
          {song.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      </div>
      <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[120px]">{song.album}</span>
      <button
        onClick={handleToggleFav}
        className={`shrink-0 mx-1 transition-colors ${fav ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}
        title={fav ? "Unfavorite" : "Favorite"}
      >
        <Heart size={14} fill={fav ? "currentColor" : "none"} />
      </button>
      <span className="text-xs text-muted-foreground w-10 text-right hidden sm:block">
        {song.duration ? formatTime(song.duration) : "--:--"}
      </span>
      {(onAddToPlaylist || onRemoveFromPlaylist || onAddToQueue) && (
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <SongContextMenu
            song={song}
            onAddToPlaylist={onAddToPlaylist}
            onAddToQueue={onAddToQueue}
            onRemoveFromPlaylist={onRemoveFromPlaylist}
          />
        </div>
      )}
    </div>
  );
}
