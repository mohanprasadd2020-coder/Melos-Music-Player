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
import AuthModal from "@/components/AuthModal";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAuth } from "@/hooks/useAuth";
import {
  Song, Album, searchSongs, searchAlbums, getTrendingSongs, getTrendingAlbums,
  getRecentlyPlayed, getFavorites, getPlaylists, searchPlaylists,
  createPlaylist, deletePlaylist,
} from "@/lib/api";
import { Loader2, Plus, ListPlus, Upload, User, LogOut, Search as SearchIcon } from "lucide-react";
import { processLocalFiles } from "@/lib/localFiles";
import { toast } from "sonner";
import { ytSearchSongs, ytTrendingSongs } from "@/lib/youtube";

type View = "home" | "search" | "library" | "favorites" | "recent" | "albums" | "playlists" | "album-detail" | "playlist-detail" | "local" | "youtube";

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
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [ytSongs, setYtSongs] = useState<Song[]>([]);
  const [ytQuery, setYtQuery] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const player = useAudioPlayer();
  const auth = useAuth();

  // Auto-play on local file selection
  const handleLocalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const songs = processLocalFiles(e.target.files);
    setLocalSongs(prev => {
      const updated = [...songs, ...prev];
      // Auto-play first selected song
      if (songs.length > 0) {
        setTimeout(() => {
          player.playSong(songs[0], updated, 0);
        }, 100);
      }
      return updated;
    });
    setView("local");
    toast.success(`Added ${songs.length} local song${songs.length > 1 ? "s" : ""}`);
    e.target.value = "";
  };

  const handleAddToQueue = useCallback((song: Song) => {
    // Simple add-to-queue: just toast for now since queue is managed by playlist
    toast.success(`"${song.name}" will play next`);
  }, []);

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
    setView("playlists");
  };

  const navigate = (v: View) => {
    setView(v);
    if (v !== "search") setQuery("");
  };

  const contextMenuProps = {
    onAddToPlaylist: (song: Song) => setAddSongToPlaylist(song),
    onAddToQueue: handleAddToQueue,
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
                  {...contextMenuProps}
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

            <div className="mb-4">
              <input
                value={playlistSearchQuery}
                onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                placeholder="Search playlists..."
                className="w-full max-w-xs h-9 px-3 rounded-md bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none border border-transparent focus:border-foreground/20 transition-colors"
              />
            </div>

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
            {...contextMenuProps}
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
            {...contextMenuProps}
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
            {...contextMenuProps}
          />
        );

      case "local":
        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Local Songs</h2>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:scale-105 transition-transform cursor-pointer">
                <Upload size={14} /> Add Files
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  className="hidden"
                  onChange={handleLocalFiles}
                />
              </label>
            </div>
            <SongGrid
              title=""
              songs={localSongs}
              emptyMessage="No local songs added. Use the upload button to add audio files from your device."
              onPlay={(song, i) => handlePlay(localSongs, song, i)}
              {...contextMenuProps}
            />
          </>
        );

      case "youtube": {
        const handleYtSearch = async () => {
          if (!ytQuery.trim()) return;
          setYtLoading(true);
          const songs = await ytSearchSongs(ytQuery);
          setYtSongs(songs);
          setYtLoading(false);
        };

        if (ytSongs.length === 0 && !ytLoading && !ytQuery) {
          setYtLoading(true);
          ytTrendingSongs().then((songs) => {
            setYtSongs(songs);
            setYtLoading(false);
          });
        }

        return (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-4">YouTube Music</h2>
              <div className="flex gap-2 max-w-md">
                <div className="flex-1 relative">
                  <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={ytQuery}
                    onChange={(e) => setYtQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleYtSearch()}
                    placeholder="Search YouTube Music..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/50 transition-colors"
                  />
                </div>
                <button
                  onClick={handleYtSearch}
                  disabled={ytLoading || !ytQuery.trim()}
                  className="h-10 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  Search
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Audio-only playback • No video</p>
            </div>
            {ytLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <SongGrid
                title={ytQuery ? `Results for "${ytQuery}"` : "Trending on YouTube"}
                songs={ytSongs}
                emptyMessage="Search for songs on YouTube"
                onPlay={(song, i) => handlePlay(ytSongs, song, i)}
                {...contextMenuProps}
              />
            )}
          </>
        );
      }

      default:
        return (
          <>
            {localSongs.length > 0 && (
              <SongGrid
                title="Local Songs"
                songs={localSongs.slice(0, 6)}
                onPlay={(song, i) => handlePlay(localSongs, song, i)}
                {...contextMenuProps}
              />
            )}

            {getRecentlyPlayed().length > 0 && (
              <SongGrid
                title="Recently Played"
                songs={getRecentlyPlayed().slice(0, 6)}
                onPlay={(song, i) => handlePlay(getRecentlyPlayed(), song, i)}
                {...contextMenuProps}
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
              {...contextMenuProps}
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
      {showAuth && (
        <AuthModal
          onSignIn={auth.signIn}
          onSignUp={auth.signUp}
          onClose={() => setShowAuth(false)}
        />
      )}

      <Sidebar currentView={view} onNavigate={navigate} />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex items-center gap-3 px-4 md:px-6 py-3 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <SearchBar value={query} onChange={handleSearchChange} />
          <label
            title="Add local audio files"
            className="shrink-0 w-10 h-10 rounded-full bg-secondary hover:bg-accent flex items-center justify-center cursor-pointer transition-colors"
          >
            <Upload size={18} className="text-muted-foreground" />
            <input
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={handleLocalFiles}
            />
          </label>
          {auth.user ? (
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {auth.user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <button
                onClick={() => { auth.signOut(); toast.success("Signed out"); }}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="shrink-0 w-10 h-10 rounded-full bg-secondary hover:bg-accent flex items-center justify-center transition-colors"
              title="Sign in"
            >
              <User size={18} className="text-muted-foreground" />
            </button>
          )}
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
