import { Home, Search, Disc3, ListMusic, HardDrive } from "lucide-react";

type View = "home" | "search" | "library" | "favorites" | "recent" | "albums" | "playlists" | "album-detail" | "playlist-detail" | "local";

interface MobileNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const items = [
  { id: "home" as View, label: "Home", icon: Home },
  { id: "search" as View, label: "Search", icon: Search },
  { id: "albums" as View, label: "Albums", icon: Disc3 },
  { id: "playlists" as View, label: "Playlists", icon: ListMusic },
  { id: "local" as View, label: "Local", icon: HardDrive },
];

export default function MobileNav({ currentView, onNavigate }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-[72px] left-0 right-0 z-40 bg-card border-t border-border flex justify-around py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon size={20} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
