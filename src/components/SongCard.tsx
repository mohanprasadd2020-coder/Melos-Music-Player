import { Play, Heart } from "lucide-react";
import { Song, isFavorite, toggleFavoriteForUser } from "@/lib/api";
import { useState } from "react";
import SongContextMenu from "./SongContextMenu";
import { useAuth } from "@/hooks/useAuth";

interface SongCardProps {
  song: Song;
  onPlay: () => void;
  onAddToPlaylist?: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
}

export default function SongCard({ song, onPlay, onAddToPlaylist, onAddToQueue }: SongCardProps) {
  const [fav, setFav] = useState(isFavorite(song.id));
  const { user } = useAuth();

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistic UI update
    setFav(!fav);
    const result = await toggleFavoriteForUser(song, user?.id);
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
          className="w-full aspect-square object-cover rounded-md shadow-md-elevated relative z-[1]"
          loading="lazy"
        />
        {onAddToPlaylist && (
          <div 
            className="absolute top-2 right-2 z-10 flex items-center justify-center bg-black/40 rounded-full hover:bg-black/60 transition-colors backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 10 }}
          >
            <SongContextMenu
              song={song}
              onAddToPlaylist={onAddToPlaylist}
              onAddToQueue={onAddToQueue}
            />
          </div>
        )}
        <button
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-lg-card hover:scale-110 z-10"
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
        </div>
      </div>
    </div>
  );
}
