import { Song } from "@/lib/api";
import SongCard from "./SongCard";
import { Loader2 } from "lucide-react";

interface SongGridProps {
  title: string;
  songs: Song[];
  loading?: boolean;
  emptyMessage?: string;
  onPlay: (song: Song, index: number) => void;
  onAddToPlaylist?: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
}

export default function SongGrid({ title, songs, loading, emptyMessage, onPlay, onAddToPlaylist, onAddToQueue }: SongGridProps) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : songs.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">{emptyMessage || "No songs found"}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {songs.map((song, i) => (
            <div key={song.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <SongCard
                song={song}
                onPlay={() => onPlay(song, i)}
                onAddToPlaylist={onAddToPlaylist}
                onAddToQueue={onAddToQueue}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
