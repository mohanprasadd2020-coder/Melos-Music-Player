import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SearchBar from "@/components/SearchBar";
import SongGrid from "@/components/SongGrid";
import MusicPlayer from "@/components/MusicPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { Song, searchSongs, getTrendingSongs, getRecentlyPlayed, getFavorites } from "@/lib/api";

type View = "home" | "search" | "library" | "favorites" | "recent";

export default function Index() {
  const [view, setView] = useState<View>("home");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const player = useAudioPlayer();

  // Load trending on mount
  useEffect(() => {
    getTrendingSongs().then(setTrending);
  }, []);

  // Live search with debounce
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await searchSongs(query);
      setSearchResults(results);
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

  const renderContent = () => {
    switch (view) {
      case "search":
        return (
          <SongGrid
            title={query ? `Results for "${query}"` : "Search for songs"}
            songs={searchResults}
            loading={loading}
            emptyMessage={query ? "No songs found. Try a different search." : "Type to search for songs..."}
            onPlay={(song, i) => handlePlay(searchResults, song, i)}
          />
        );
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
      <Sidebar currentView={view} onNavigate={setView} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-4 px-4 md:px-6 py-3 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <SearchBar value={query} onChange={handleSearchChange} />
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-6 py-4 pb-40">
          {renderContent()}
        </div>
      </main>

      <MobileNav currentView={view} onNavigate={setView} />
      <MusicPlayer
        song={player.currentSong}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        onTogglePlay={player.togglePlay}
        onNext={player.handleNext}
        onPrev={player.handlePrev}
        onSeek={player.seek}
        onVolumeChange={player.changeVolume}
      />
    </div>
  );
}
