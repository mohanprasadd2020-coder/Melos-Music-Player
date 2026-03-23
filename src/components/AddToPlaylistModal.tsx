import { useState } from "react";
import { X, Plus, Check } from "lucide-react";
import { Song, getPlaylists, createPlaylist, addSongToPlaylist } from "@/lib/api";

interface AddToPlaylistModalProps {
  song: Song;
  onClose: () => void;
}

export default function AddToPlaylistModal({ song, onClose }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState(getPlaylists());
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const handleCreate = () => {
    if (!newName.trim()) return;
    const pl = createPlaylist(newName.trim());
    addSongToPlaylist(pl.id, song);
    setAdded(prev => new Set(prev).add(pl.id));
    setPlaylists(getPlaylists());
    setNewName("");
    setCreating(false);
  };

  const handleAdd = (playlistId: string) => {
    const success = addSongToPlaylist(playlistId, song);
    if (success) {
      setAdded(prev => new Set(prev).add(playlistId));
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl animate-scale-in"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Add to Playlist</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {/* Add to song info */}
          <div className="flex items-center gap-3 mb-4 bg-accent/50 rounded-md p-2">
            <img src={song.image || "/placeholder.svg"} alt="" className="w-10 h-10 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{song.name}</p>
              <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
            </div>
          </div>

          {/* Create new */}
          {creating ? (
            <div className="flex gap-2 mb-3">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Playlist name"
                className="flex-1 h-9 px-3 rounded-md bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/50"
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="h-9 px-3 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
              >
                Create
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-primary hover:bg-accent transition-colors mb-2"
            >
              <Plus size={18} /> New Playlist
            </button>
          )}

          {/* Existing playlists */}
          <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
            {playlists.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No playlists yet</p>
            ) : (
              playlists.map((pl) => {
                const isAdded = added.has(pl.id) || pl.songs.some(s => s.id === song.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => !isAdded && handleAdd(pl.id)}
                    disabled={isAdded}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                      isAdded ? "opacity-60" : "hover:bg-accent"
                    }`}
                  >
                    {pl.image ? (
                      <img src={pl.image} alt="" className="w-9 h-9 rounded object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-secondary flex items-center justify-center shrink-0">
                        <Plus size={14} className="text-muted-foreground" />
                      </div>
                    )}
                    <span className="flex-1 truncate text-foreground">{pl.name}</span>
                    {isAdded && <Check size={16} className="text-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
