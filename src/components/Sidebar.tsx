import { Home, Search, Library, Heart, Clock } from "lucide-react";

type View = "home" | "search" | "library" | "favorites" | "recent";

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const navItems = [
  { id: "home" as View, label: "Home", icon: Home },
  { id: "search" as View, label: "Search", icon: Search },
  { id: "library" as View, label: "Your Library", icon: Library },
];

const playlistItems = [
  { id: "favorites" as View, label: "Liked Songs", icon: Heart },
  { id: "recent" as View, label: "Recently Played", icon: Clock },
];

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-60 bg-sidebar shrink-0 h-full">
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <span className="inline-block w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-black">♪</span>
          </span>
          Melos
        </h1>
      </div>

      <nav className="px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border mx-3 my-2" />

      <nav className="px-3 py-2 space-y-1">
        {playlistItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
