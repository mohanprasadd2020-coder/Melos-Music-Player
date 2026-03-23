import { Play, Music, MoreVertical, Trash2 } from "lucide-react";
import { Playlist } from "@/lib/api";
import { useState } from "react";

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  onDelete?: () => void;
}

export default function PlaylistCard({ playlist, onClick, onDelete }: PlaylistCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group relative bg-card hover:bg-accent rounded-lg p-3 cursor-pointer transition-all duration-200"
    >
      <div className="relative mb-3">
        {playlist.image ? (
          <img
            src={playlist.image}
            alt={playlist.name}
            className="w-full aspect-square object-cover rounded-md shadow-lg"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-square rounded-md shadow-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
            <Music className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <button
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-xl hover:scale-105"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <Play size={18} fill="currentColor" />
        </button>
        {onDelete && (
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="w-7 h-7 rounded-full bg-background/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-foreground hover:bg-background"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-card border border-border rounded-md shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent rounded-md transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <h3 className="text-sm font-semibold text-foreground truncate">{playlist.name}</h3>
      <p className="text-xs text-muted-foreground truncate mt-0.5">
        {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"}
      </p>
    </div>
  );
}
