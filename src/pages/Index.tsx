import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SearchBar from "@/components/SearchBar";
import SongGrid from "@/components/SongGrid";
import MusicPlayer from "@/components/MusicPlayer";
import AlbumCard from "@/components/AlbumCard";
import AlbumDetail from "@/components/AlbumDetail";
import PlaylistCard from "@/components/PlaylistCard";
import PlaylistDetail from "@/components/PlaylistDetail";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import {
  Song, Album, searchSongs, searchAlbums, getTrendingSongs, getTrendingAlbums,
  getRecentlyPlayed, getFavorites, getPlaylists, searchPlaylists,
  createPlaylist, deletePlaylist,
} from "@/lib/api";
import { Loader2, Plus, ListPlus, Upload } from "lucide-react";
import { processLocalFiles } from "@/lib/localFiles";

type View = "home" | "search" | "library" | "favorites" | "recent" | "albums" | "playlists" | "album-detail" | "playlist-detail";

export default function Index() {
  const [view, setView] = useState<View>("home");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [albumResults, setAlbumResults] = useState<Album[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  const [trendingAlbums, setTrendingAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [addSongToPlaylist, setAddSongToPlaylist] = useState<Song | null>(null);
  const player = useAudioPlayer();

  useEffect(() => {
    getTrendingSongs().then(setTrending);
    getTrendingAlbums().then(setTrendingAlbums);
  }, []);

  // Live search
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); setAlbumResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const [songs, albums] = await Promise.all([searchSongs(query), searchAlbums(query)]);
      setSearchResults(songs);
      setAlbumResults(albums);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handlePlay = useCallback((songs: Song[], song: Song, index: number) => {
    player.playSong(song, songs, index);
  }, [player]);

  const handleSearchChange = (v: string) => {
    setQuery(v);
    if (v && view !== "search") setView("search");
  };

  const openAlbum = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setView("album-detail");
  };

  const openPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setView("playlist-detail");
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName("");
    setShowCreatePlaylist(false);
  };

  const handleDeletePlaylist = (id: string) => {
    deletePlaylist(id);
    // Force re-render by toggling view
    setView("playlists");
  };

  const navigate = (v: View) => {
    setView(v);
    if (v !== "search") setQuery("");
  };

  const renderContent = () => {
    switch (view) {
      case "search":
        return (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <>
                {albumResults.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-foreground mb-4">Albums</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                      {albumResults.slice(0, 6).map((album, i) => (
                        <div key={album.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                          <AlbumCard album={album} onClick={() => openAlbum(album.id)} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                <SongGrid
                  title={query ? `Songs for "${query}"` : "Search for songs"}
                  songs={searchResults}
                  emptyMessage={query ? "No songs found." : "Type to search..."}
                  onPlay={(song, i) => handlePlay(searchResults, song, i)}
                />
              </>
            )}
          </>
        );

      case "album-detail":
        return (
          <AlbumDetail
            albumId={selectedAlbumId}
            onBack={() => setView("albums")}
            onPlay={handlePlay}
            currentSongId={player.currentSong?.id}
          />
        );

      case "playlist-detail":
        return (
          <PlaylistDetail
            playlistId={selectedPlaylistId}
            onBack={() => setView("playlists")}
            onPlay={handlePlay}
            currentSongId={player.currentSong?.id}
          />
        );

      case "albums":
        return (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Browse Albums</h2>
            {trendingAlbums.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {trendingAlbums.map((album, i) => (
                  <div key={album.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <AlbumCard album={album} onClick={() => openAlbum(album.id)} />
                  </div>
                ))}
              </div>
            )}
          </section>
        );

      case "playlists": {
        const filteredPlaylists = playlistSearchQuery
          ? searchPlaylists(playlistSearchQuery)
          : getPlaylists();

        return (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Your Playlists</h2>
              <button
                onClick={() => setShowCreatePlaylist(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:scale-105 transition-transform"
              >
                <Plus size={14} /> New
              </button>
            </div>

            {/* Playlist search */}
            <div className="mb-4">
              <input
                value={playlistSearchQuery}
                onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                placeholder="Search playlists..."
                className="w-full max-w-xs h-9 px-3 rounded-md bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none border border-transparent focus:border-foreground/20 transition-colors"
              />
            </div>

            {/* Create modal */}
            {showCreatePlaylist && (
              <div className="mb-4 flex gap-2 items-center bg-card p-3 rounded-lg border border-border">
                <input
                  autoFocus
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
                  placeholder="Playlist name"
                  className="flex-1 h-9 px-3 rounded-md bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/50"
                />
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="h-9 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowCreatePlaylist(false); setNewPlaylistName(""); }}
                  className="h-9 px-3 text-muted-foreground hover:text-foreground text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            {filteredPlaylists.length === 0 ? (
              <div className="text-center py-12">
                <ListPlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  {playlistSearchQuery ? "No playlists found" : "No playlists yet. Create one!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredPlaylists.map((pl, i) => (
                  <div key={pl.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <PlaylistCard
                      playlist={pl}
                      onClick={() => openPlaylist(pl.id)}
                      onDelete={() => handleDeletePlaylist(pl.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      }

      case "favorites":
        const favs = getFavorites();
        return (
          <SongGrid
            title="Liked Songs"
            songs={favs}
            emptyMessage="No liked songs yet. Click the heart icon on a song to save it."
            onPlay={(song, i) => handlePlay(favs, song, i)}
          />
        );

      case "recent":
        const recent = getRecentlyPlayed();
        return (
          <SongGrid
            title="Recently Played"
            songs={recent}
            emptyMessage="No recently played songs."
            onPlay={(song, i) => handlePlay(recent, song, i)}
          />
        );

      case "library":
        const lib = [...getFavorites(), ...getRecentlyPlayed()];
        const unique = lib.filter((s, i, a) => a.findIndex(x => x.id === s.id) === i);
        return (
          <SongGrid
            title="Your Library"
            songs={unique}
            emptyMessage="Your library is empty. Search and play some songs!"
            onPlay={(song, i) => handlePlay(unique, song, i)}
          />
        );

      default:
        return (
          <>
            {getRecentlyPlayed().length > 0 && (
              <SongGrid
                title="Recently Played"
                songs={getRecentlyPlayed().slice(0, 6)}
                onPlay={(song, i) => handlePlay(getRecentlyPlayed(), song, i)}
              />
            )}

            {trendingAlbums.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Popular Albums</h2>
                  <button onClick={() => navigate("albums")} className="text-xs text-muted-foreground hover:text-foreground">
                    Show all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {trendingAlbums.slice(0, 6).map((album, i) => (
                    <div key={album.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <AlbumCard album={album} onClick={() => openAlbum(album.id)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {getPlaylists().length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Your Playlists</h2>
                  <button onClick={() => navigate("playlists")} className="text-xs text-muted-foreground hover:text-foreground">
                    Show all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {getPlaylists().slice(0, 6).map((pl, i) => (
                    <div key={pl.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <PlaylistCard playlist={pl} onClick={() => openPlaylist(pl.id)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <SongGrid
              title="Trending Now"
              songs={trending}
              loading={trending.length === 0}
              onPlay={(song, i) => handlePlay(trending, song, i)}
            />
          </>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {addSongToPlaylist && (
        <AddToPlaylistModal song={addSongToPlaylist} onClose={() => setAddSongToPlaylist(null)} />
      )}

      <Sidebar currentView={view} onNavigate={navigate} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-4 md:px-6 py-3 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <SearchBar value={query} onChange={handleSearchChange} />
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-6 py-4 pb-40">
          {renderContent()}
        </div>
      </main>

      <MobileNav currentView={view} onNavigate={navigate} />
      <MusicPlayer
        song={player.currentSong}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        shuffle={player.shuffle}
        repeat={player.repeat}
        queue={player.queue}
        queueIndex={player.queueIndex}
        onTogglePlay={player.togglePlay}
        onNext={player.handleNext}
        onPrev={player.handlePrev}
        onSeek={player.seek}
        onVolumeChange={player.changeVolume}
        onToggleShuffle={player.toggleShuffle}
        onToggleRepeat={player.toggleRepeat}
        onPlayFromQueue={player.playFromQueue}
      />
    </div>
  );
}
