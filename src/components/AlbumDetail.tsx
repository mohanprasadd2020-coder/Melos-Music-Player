import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Play, Loader2, Plus, ListPlus, Heart } from "lucide-react";
import { Album, Song, getAlbumDetails, toggleFavorite, isFavorite } from "@/lib/api";
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
  const [addMultiple, setAddMultiple] = useState<Song[] | null>(null);
  const [favorites, setFavorites] = useState(new Set<string>());

  useEffect(() => {
    setLoading(true);
    getAlbumDetails(albumId).then((a) => {
      setAlbum(a);
      const favs = new Set<string>();
      a.songs?.forEach(song => {
        if (isFavorite(song.id)) favs.add(song.id);
      });
      setFavorites(favs);
      setLoading(false);
    });
  }, [albumId]);

  const handlePlayAll = useCallback(() => {
    if (album?.songs && album.songs.length > 0) {
      onPlay(album.songs, album.songs[0], 0);
    }
  }, [album, onPlay]);

  const handleAddAllToFavorites = useCallback(() => {
    if (album?.songs) {
      const newFavs = new Set(favorites);
      album.songs.forEach(song => {
        if (!isFavorite(song.id)) {
          toggleFavorite(song);
          newFavs.add(song.id);
        }
      });
      setFavorites(newFavs);
    }
  }, [album, favorites]);

  const handleAddAllToPlaylist = useCallback(() => {
    if (album?.songs && album.songs.length > 0) {
      setAddMultiple(album.songs);
    }
  }, [album]);

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
      {addMultiple && (
        <AddToPlaylistModal songs={addMultiple} onClose={() => setAddMultiple(null)} />
      )}

      {/* Header */}
      <div className="flex items-end gap-5 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground mb-1" title="Go back">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <button
              onClick={handlePlayAll}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors"
              title="Play all songs"
            >
              <Play size={14} fill="currentColor" /> <span className="hidden sm:inline">Play All</span><span className="sm:hidden">Play</span>
            </button>
            <button
              onClick={handleAddAllToPlaylist}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs sm:text-sm font-semibold hover:bg-secondary/90 transition-colors"
              title="Add all to playlist"
            >
              <ListPlus size={14} /> <span className="hidden sm:inline">Add to Playlist</span><span className="sm:hidden">Add</span>
            </button>
            <button
              onClick={handleAddAllToFavorites}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-xs sm:text-sm font-semibold hover:bg-accent/90 transition-colors"
              title="Add all to favorites"
            >
              <Heart size={14} /> <span className="hidden sm:inline">Favorites</span><span className="sm:hidden">♥</span>
            </button>
          </div>
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
