import { Play, Heart } from "lucide-react";
import { Song, isFavorite, toggleFavorite } from "@/lib/api";
import { useState } from "react";
import SongContextMenu from "./SongContextMenu";

interface SongCardProps {
  song: Song;
  onPlay: () => void;
  onAddToPlaylist?: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
}

export default function SongCard({ song, onPlay, onAddToPlaylist, onAddToQueue }: SongCardProps) {
  const [fav, setFav] = useState(isFavorite(song.id));

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = toggleFavorite(song);
    setFav(result);
  };

  return (
    <div
      onClick={onPlay}
      className="group relative bg-card hover:bg-accent rounded-lg p-3 cursor-pointer hover-elevate shadow-sm-subtle hover:shadow-md-elevated"
    >
      <div className="relative mb-3">
        <img
          src={song.image || "/placeholder.svg"}
          alt={song.name}
          className="w-full aspect-square object-cover rounded-md shadow-md-elevated"
          loading="lazy"
        />
        <button
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-lg-card hover:scale-110"
          onClick={onPlay}
          title="Play"
        >
          <Play size={18} fill="currentColor" />
        </button>
      </div>
      <h3 className="text-sm font-semibold text-foreground truncate">{song.name}</h3>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground truncate mt-0.5 flex-1">{song.artist}</p>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={handleFav}
            className={`ml-1 transition-colors ${fav ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title={fav ? "Unfavorite" : "Favorite"}
          >
            <Heart size={14} fill={fav ? "currentColor" : "none"} />
          </button>
          {onAddToPlaylist && (
            <div onClick={(e) => e.stopPropagation()}>
              <SongContextMenu
                song={song}
                onAddToPlaylist={onAddToPlaylist}
                onAddToQueue={onAddToQueue}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
