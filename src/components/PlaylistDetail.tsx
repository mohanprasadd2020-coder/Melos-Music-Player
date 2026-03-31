import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Play, Loader2, Trash2, ListPlus, Heart } from "lucide-react";
import { Song, Playlist, removeSongFromPlaylist, toggleFavorite, isFavorite, removeSongFromPlaylistForUser } from "@/lib/api";
import SongRow from "./SongRow";
import AddToPlaylistModal from "./AddToPlaylistModal";

interface PlaylistDetailProps {
  playlist: Playlist | null;
  playlistId: string;
  userId?: string;
  allPlaylists: Playlist[];
  onBack: () => void;
  onPlay: (songs: Song[], song: Song, index: number) => void;
  onUpdatePlaylist: (updatedPlaylist: Playlist) => void;
  onCreatePlaylist?: (name: string) => Promise<Playlist>;
  onAddToPlaylist?: (playlistId: string, songs: Song[]) => Promise<boolean>;
  currentSongId?: string;
}

export default function PlaylistDetail({ 
  playlist: initialPlaylist,
  playlistId, 
  userId,
  allPlaylists,
  onBack, 
  onPlay,
  onUpdatePlaylist,
  onCreatePlaylist,
  onAddToPlaylist,
  currentSongId 
}: PlaylistDetailProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(initialPlaylist);
  const [addMultiple, setAddMultiple] = useState<Song[] | null>(null);
  const [favorites, setFavorites] = useState(new Set<string>());

  useEffect(() => {
    if (initialPlaylist) {
      setPlaylist(initialPlaylist);
      const favs = new Set<string>();
      initialPlaylist.songs.forEach(song => {
        if (isFavorite(song.id)) favs.add(song.id);
      });
      setFavorites(favs);
    }
  }, [initialPlaylist, playlistId]);

  const handleRemoveSong = async (songId: string) => {
    if (!playlist) return;
    try {
      // Update both localStorage and database
      await removeSongFromPlaylistForUser(playlistId, songId, userId);
      const updatedPlaylist = { ...playlist, songs: playlist.songs.filter(s => s.id !== songId) };
      setPlaylist(updatedPlaylist);
      onUpdatePlaylist(updatedPlaylist);
    } catch (err) {
      console.error("Error removing song:", err);
    }
  };

  const handlePlayAll = useCallback(() => {
    if (playlist?.songs && playlist.songs.length > 0) {
      onPlay(playlist.songs, playlist.songs[0], 0);
    }
  }, [playlist, onPlay]);

  const handleAddAllToFavorites = useCallback(() => {
    if (playlist?.songs) {
      const newFavs = new Set(favorites);
      playlist.songs.forEach(song => {
        if (!isFavorite(song.id)) {
          toggleFavorite(song);
          newFavs.add(song.id);
        }
      });
      setFavorites(newFavs);
    }
  }, [playlist, favorites]);

  const handleAddAllToPlaylist = useCallback(() => {
    if (playlist?.songs && playlist.songs.length > 0) {
      setAddMultiple(playlist.songs);
    }
  }, [playlist]);

  if (!playlist) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Playlist not found</p>
        <button onClick={onBack} className="text-primary text-sm mt-2 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div>
      {addMultiple && (
        <AddToPlaylistModal 
          songs={addMultiple} 
          playlists={allPlaylists.filter(p => p.id !== playlistId)}
          userId={userId}
          onClose={() => setAddMultiple(null)}
          onCreatePlaylist={onCreatePlaylist || (async (name) => { throw new Error("Not implemented"); })}
          onAddToPlaylist={onAddToPlaylist || (async () => false)}
        />
      )}
      {/* Header */}
      <div className="flex items-end gap-5 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground mb-1" title="Go back">
          <ArrowLeft size={20} />
        </button>
        {playlist.image ? (
          <img src={playlist.image} alt="" className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg shadow-xl object-cover shrink-0" />
        ) : (
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg shadow-xl bg-gradient-to-br from-primary/30 to-accent shrink-0 flex items-center justify-center">
            <ListPlus className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Playlist</p>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">{playlist.name}</h1>
          {playlist.description && <p className="text-sm text-muted-foreground mt-1">{playlist.description}</p>}
          <p className="text-sm text-muted-foreground mt-0.5">{playlist.songs.length} songs</p>
          {playlist.songs.length > 0 && (
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
                title="Add all to another playlist"
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
          )}
        </div>
      </div>

      {/* Song list */}
      {playlist.songs.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">
          This playlist is empty. Search for songs and add them here!
        </p>
      ) : (
        <div className="space-y-0.5">
          {playlist.songs.map((song, i) => (
            <div key={song.id} className="flex items-center">
              <div className="flex-1">
                <SongRow
                  song={song}
                  index={i}
                  isActive={song.id === currentSongId}
                  onPlay={() => onPlay(playlist.songs, song, i)}
                />
              </div>
              <button
                onClick={() => handleRemoveSong(song.id)}
                className="shrink-0 p-2 text-muted-foreground hover:text-destructive transition-colors"
                title="Remove from playlist"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
