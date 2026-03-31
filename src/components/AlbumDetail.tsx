import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Play, Loader2, Plus, ListPlus, Heart } from "lucide-react";
import { Album, Song, Playlist, getAlbumDetails, toggleFavorite, isFavorite } from "@/lib/api";
import SongRow from "./SongRow";
import AddToPlaylistModal from "./AddToPlaylistModal";

interface AlbumDetailProps {
  albumId: string;
  onBack: () => void;
  onPlay: (songs: Song[], song: Song, index: number) => void;
  currentSongId?: string;
  userId?: string;
  playlists?: Playlist[];
  onCreatePlaylist?: (name: string) => Promise<Playlist>;
  onAddToPlaylist?: (playlistId: string, songs: Song[]) => Promise<boolean>;
}

export default function AlbumDetail({ 
  albumId, 
  onBack, 
  onPlay, 
  currentSongId,
  userId,
  playlists = [],
  onCreatePlaylist,
  onAddToPlaylist
}: AlbumDetailProps) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [addSong, setAddSong] = useState<Song | null>(null);
  const [addMultiple, setAddMultiple] = useState<Song[] | null>(null);
  const [favorites, setFavorites] = useState(new Set<string>());

  useEffect(() => {
    console.log("[AlbumDetail] Starting to load album with ID:", albumId);
    setLoading(true);
    
    getAlbumDetails(albumId)
      .then((a) => {
        console.log("[AlbumDetail] Album loaded successfully:", a);
        if (!a) {
          console.warn("[AlbumDetail] Album is null/undefined");
          setAlbum(null);
          setLoading(false);
          return;
        }
        setAlbum(a);
        const favs = new Set<string>();
        a.songs?.forEach(song => {
          if (isFavorite(song.id)) favs.add(song.id);
        });
        setFavorites(favs);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[AlbumDetail] Error loading album:", err);
        setAlbum(null);
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

  const albumImage = album.image || "/placeholder.svg";
  const albumName = album.name || "Unknown Album";
  const albumArtist = album.artist || "Unknown Artist";
  const albumYear = album.year || "";
  const albumSongCount = album.songCount || 0;

  return (
    <div>
      {addSong && onCreatePlaylist && onAddToPlaylist && (
        <AddToPlaylistModal 
          song={addSong} 
          playlists={playlists}
          userId={userId}
          onClose={() => setAddSong(null)}
          onCreatePlaylist={onCreatePlaylist}
          onAddToPlaylist={onAddToPlaylist}
        />
      )}
      {addMultiple && onCreatePlaylist && onAddToPlaylist && (
        <AddToPlaylistModal 
          songs={addMultiple}
          playlists={playlists}
          userId={userId}
          onClose={() => setAddMultiple(null)}
          onCreatePlaylist={onCreatePlaylist}
          onAddToPlaylist={onAddToPlaylist}
        />
      )}

      {/* Header */}
      <div className="flex items-end gap-5 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground mb-1" title="Go back">
          <ArrowLeft size={20} />
        </button>
        <img
          src={albumImage}
          alt={albumName}
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg shadow-xl object-cover shrink-0"
          onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
        />
        <div className="min-w-0">
          <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Album</p>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">{albumName}</h1>
          <p className="text-sm text-muted-foreground mt-1">{albumArtist} {albumYear && `· ${albumYear}`} · {albumSongCount} songs</p>
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
        {album.songs && album.songs.length > 0 ? (
          album.songs.map((song, i) => (
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
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No songs in this album</p>
          </div>
        )}
      </div>
    </div>
  );
}
