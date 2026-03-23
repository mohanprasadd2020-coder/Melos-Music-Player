import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Play, Loader2, Plus, ListPlus } from "lucide-react";
import { Album, Song, getAlbumDetails } from "@/lib/api";
import SongRow from "./SongRow";
import AddToPlaylistModal from "./AddToPlaylistModal";

interface AlbumDetailProps {
  albumId: string;
  onBack: () => void;
  onPlay: (songs: Song[], song: Song, index: number) => void;
  currentSongId?: string;
}

export default function AlbumDetail({ albumId, onBack, onPlay, currentSongId }: AlbumDetailProps) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [addSong, setAddSong] = useState<Song | null>(null);

  useEffect(() => {
    setLoading(true);
    getAlbumDetails(albumId).then((a) => {
      setAlbum(a);
      setLoading(false);
    });
  }, [albumId]);

  const handlePlayAll = useCallback(() => {
    if (album?.songs && album.songs.length > 0) {
      onPlay(album.songs, album.songs[0], 0);
    }
  }, [album, onPlay]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Album not found</p>
        <button onClick={onBack} className="text-primary text-sm mt-2 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div>
      {addSong && (
        <AddToPlaylistModal song={addSong} onClose={() => setAddSong(null)} />
      )}

      {/* Header */}
      <div className="flex items-end gap-5 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground mb-1">
          <ArrowLeft size={20} />
        </button>
        <img
          src={album.image || "/placeholder.svg"}
          alt={album.name}
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg shadow-xl object-cover shrink-0"
        />
        <div className="min-w-0">
          <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Album</p>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">{album.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{album.artist} · {album.year} · {album.songCount} songs</p>
          <button
            onClick={handlePlayAll}
            className="mt-3 inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:scale-105 transition-transform"
          >
            <Play size={16} fill="currentColor" /> Play All
          </button>
        </div>
      </div>

      {/* Song list */}
      <div className="space-y-0.5">
        {album.songs?.map((song, i) => (
          <div key={song.id} className="flex items-center">
            <div className="flex-1">
              <SongRow
                song={song}
                index={i}
                isActive={song.id === currentSongId}
                onPlay={() => onPlay(album.songs!, song, i)}
              />
            </div>
            <button
              onClick={() => setAddSong(song)}
              className="shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Add to playlist"
            >
              <ListPlus size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
