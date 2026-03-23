import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Play, Loader2, Trash2, ListPlus } from "lucide-react";
import { Song, Playlist, getPlaylistById, removeSongFromPlaylist } from "@/lib/api";
import SongRow from "./SongRow";

interface PlaylistDetailProps {
  playlistId: string;
  onBack: () => void;
  onPlay: (songs: Song[], song: Song, index: number) => void;
  currentSongId?: string;
}

export default function PlaylistDetail({ playlistId, onBack, onPlay, currentSongId }: PlaylistDetailProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    setPlaylist(getPlaylistById(playlistId));
  }, [playlistId]);

  const handleRemoveSong = (songId: string) => {
    removeSongFromPlaylist(playlistId, songId);
    setPlaylist(getPlaylistById(playlistId));
  };

  const handlePlayAll = useCallback(() => {
    if (playlist?.songs && playlist.songs.length > 0) {
      onPlay(playlist.songs, playlist.songs[0], 0);
    }
  }, [playlist, onPlay]);

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
      {/* Header */}
      <div className="flex items-end gap-5 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground mb-1">
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
            <button
              onClick={handlePlayAll}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:scale-105 transition-transform"
            >
              <Play size={16} fill="currentColor" /> Play All
            </button>
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
