import { Song } from "@/lib/api";
import SongCard from "./SongCard";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SongGridProps {
  title: string;
  songs: Song[];
  loading?: boolean;
  emptyMessage?: string;
  onPlay: (song: Song, index: number) => void;
  onAddToPlaylist?: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
}

function SongSkeleton() {
  return (
    <div className="bg-card rounded-lg p-3 shadow-sm-subtle">
      <Skeleton className="w-full aspect-square rounded-md mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export default function SongGrid({ title, songs, loading, emptyMessage, onPlay, onAddToPlaylist, onAddToQueue }: SongGridProps) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
              <SongSkeleton />
            </div>
          ))}
        </div>
      ) : songs.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">{emptyMessage || "No songs found"}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {songs.map((song, i) => (
            <div key={song.id} className="animate-fade-up" style={{ animationDelay: `${(i % 10) * 40}ms` }}>
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
