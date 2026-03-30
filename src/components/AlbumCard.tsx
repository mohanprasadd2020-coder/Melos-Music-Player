import { Play, Music } from "lucide-react";
import { Album } from "@/lib/api";

interface AlbumCardProps {
  album: Album;
  onClick: () => void;
}

export default function AlbumCard({ album, onClick }: AlbumCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-card hover:bg-accent rounded-lg p-3 cursor-pointer hover-elevate shadow-sm-subtle hover:shadow-md-elevated"
    >
      <div className="relative mb-3">
        {album.image ? (
          <img
            src={album.image}
            alt={album.name}
            className="w-full aspect-square object-cover rounded-md shadow-md-elevated"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-square rounded-md shadow-md-elevated bg-secondary flex items-center justify-center">
            <Music className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <button
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-lg-card hover:scale-110"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <Play size={18} fill="currentColor" />
        </button>
      </div>
      <h3 className="text-sm font-semibold text-foreground truncate">{album.name}</h3>
      <p className="text-xs text-muted-foreground truncate mt-0.5">
        {album.artist} {album.year && `· ${album.year}`}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{album.songCount} songs</p>
    </div>
  );
}
