import { Home, Search, Library, Heart, Clock, Disc3, ListMusic, HardDrive, Youtube } from "lucide-react";

type View = "home" | "search" | "library" | "favorites" | "recent" | "albums" | "playlists" | "album-detail" | "playlist-detail" | "local" | "youtube";

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const navItems = [
  { id: "home" as View, label: "Home", icon: Home },
  { id: "search" as View, label: "Search", icon: Search },
  { id: "library" as View, label: "Your Library", icon: Library },
];

const browseItems = [
  { id: "albums" as View, label: "Albums", icon: Disc3 },
  { id: "playlists" as View, label: "Playlists", icon: ListMusic },
  { id: "youtube" as View, label: "YouTube Music", icon: Youtube },
];

const playlistItems = [
  { id: "favorites" as View, label: "Liked Songs", icon: Heart },
  { id: "recent" as View, label: "Recently Played", icon: Clock },
  { id: "local" as View, label: "Local Songs", icon: HardDrive },
];

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const renderNav = (items: typeof navItems) =>
    items.map((item) => {
      const Icon = item.icon;
      const active = currentView === item.id;
      return (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
            active
              ? "bg-sidebar-accent text-foreground shadow-sm-subtle"
              : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
          }`}
        >
          <Icon size={20} />
          {item.label}
        </button>
      );
    });

  return (
    <aside className="hidden md:flex flex-col w-60 bg-sidebar shrink-0 h-full">
      <div className="p-6 pb-2 flex items-center justify-center">
        <img 
          src="https://i.postimg.cc/c4tt7ffM/Gemini-Generated-Image-kx8qvmkx8qvmkx8q.png" 
          alt="Melos Music Player" 
          className="h-20 w-auto object-contain"
        />
      </div>

      <nav className="px-3 py-4 space-y-1">{renderNav(navItems)}</nav>

      <div className="border-t border-sidebar-border mx-3 my-1" />
      <p className="px-6 pt-2 pb-1 text-xs uppercase text-muted-foreground font-semibold tracking-wider">Browse</p>
      <nav className="px-3 py-1 space-y-1">{renderNav(browseItems)}</nav>

      <div className="border-t border-sidebar-border mx-3 my-1" />
      <p className="px-6 pt-2 pb-1 text-xs uppercase text-muted-foreground font-semibold tracking-wider">Collection</p>
      <nav className="px-3 py-1 space-y-1">{renderNav(playlistItems)}</nav>
    </aside>
  );
}
