# 🎵 JioSaavn Jam - Music Streaming Web Player

A modern React-based music streaming application with playlist management, search, and playback controls.

## ✨ Features

- **🎵 Music Playback**: Stream songs from JioSaavn API with YouTube fallback
- **📝 Playlists**: Create, manage, and organize your favorite songs
- **🔍 Search**: Find songs by title, artist, or album
- **📀 Albums**: Browse and play complete albums
- **❤️ Favorites**: Mark songs as liked for quick access
- **⏱️ Recently Played**: Automatic history tracking
- **🎧 Advanced Player**: Shuffle, repeat (all/one), queue management
- **📱 Mobile Responsive**: Full mobile & tablet support
- **💾 Local Storage**: All playlists persist locally
- **🎬 YouTube Integration**: Songs with no JioSaavn source fall back to YouTube
- **🖥️ Local Files**: Upload and play audio files from your device

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# Navigate to http://localhost:8080/
```

## 📋 Usage Guide

### Creating a Playlist

1. Click **"Playlists"** in the sidebar
2. Click the **"New"** button (top right)
3. Enter playlist name and press Enter or click Create
4. Your new playlist appears in the grid

### Adding Songs to Playlists

**From Search/Browse:**

1. Click the **three-dot menu** (⋯) on any song
2. Select **"Add to Playlist"**
3. Choose a playlist or create a new one
4. Song is added (duplicates are prevented automatically)

**From Playlist View:**

- Open a playlist and add from the same context menu

### Playing a Playlist

1. Click a playlist card to open it
2. Click **"Play All"** (blue button) to play from the first song
3. OR click any song to start from that track
4. Full playlist loads into queue for next/previous navigation

### Managing Playlists

**View Songs:**

- Open any playlist card
- All songs display with artist, album, and duration

**Remove Songs:**

- In playlist view, click the **trash icon** (🗑️) next to any song
- Song is removed from playlist only (not from library)

**Delete Playlist:**

- In playlists grid, click the **three-dot menu** (⋯) on playlist card
- Select **"Delete"** to remove entire playlist

### Playback Controls

- **Play/Pause**: Large play button in mini player
- **Next/Previous**: Skip buttons (respect current queue/playlist)
- **Shuffle**: Randomize playback order (Shuffle icon)
- **Repeat**:
  - Off (no repeat)
  - All (loop entire playlist)
  - One (repeat current song)
- **Volume**: Slider on player bar
- **Queue Panel**: View upcoming songs (list icon)
- **Full Screen**: Click song info to expand player

### Search & Discovery

- **Search Bar**: Find songs, albums, playlists
- **Trending**: Browse popular songs on home
- **Albums**: View and play complete albums
- **Recently Played**: Auto-saved play history
- **Liked Songs**: Marked favorites (click heart icon)
- **Local Songs**: Upload audio files from your device
- **YouTube Music**: Search and stream from YouTube

## 🔒 Data Storage

All playlists are stored in your browser's **localStorage**:

- ✅ Persists after refresh/close
- ✅ No account required
- ✅ ~5MB capacity (browser dependent)
- ✅ Local browser only (no cloud sync)

**To Clear Playlists:**

1. Open DevTools: F12 → Application tab
2. Find **localStorage** → your domain
3. Delete key: `playlists`

## 🎮 Keyboard Shortcuts

- **Search Bar**: Cmd/Ctrl + K (if implemented)
- **Play/Pause**: Space (when focused on player)
- **Enter**: Create playlist / search

## 📱 Mobile Features

- ✅ Responsive layout (mobile, tablet, desktop)
- ✅ Bottom mobile navigation (Home, Search, Library, More)
- ✅ Touch-friendly buttons and controls
- ✅ Full-screen player mode
- ✅ Swipe-compatible menus (drawer)

## 🏗️ Project Structure

```
src/
├── components/
│   ├── PlaylistCard.tsx          # Playlist grid display
│   ├── PlaylistDetail.tsx         # Playlist view & management
│   ├── AddToPlaylistModal.tsx     # Add-to-playlist dialog
│   ├── SongCard.tsx               # Song grid display
│   ├── SongRow.tsx                # Song list display
│   ├── SongContextMenu.tsx        # Context menu + playlist option
│   ├── MusicPlayer.tsx            # Main player controls
│   ├── QueuePanel.tsx             # Queue/now-playing view
│   ├── SearchBar.tsx              # Search input
│   └── ...other components
├── hooks/
│   ├── useAudioPlayer.ts          # Player state & controls
│   └── useAuth.ts                 # Authentication (optional)
├── lib/
│   ├── api.ts                     # JioSaavn API + localStorage
│   ├── youtube.ts                 # YouTube music fallback
│   ├── lyrics.ts                  # Lyrics integration
│   └── localFiles.ts              # Local file handling
└── pages/
    └── Index.tsx                  # Main app page
```

## 🔧 Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Watch mode for tests
```

## 🚨 Troubleshooting

**No songs appear in search?**

- Check internet connection
- The JioSaavn API may be temporarily down (YouTube fallback available)

**Playlist not saving?**

- Ensure browser allows localStorage
- Check privacy mode (incognito) disables storage

**Player not working?**

- Check browser console for errors (F12)
- Ensure audio isn't muted
- Try a different song

**YouTube fallback not working?**

- Some songs may not have YouTube matches
- Check YouTube is accessible in your region

## 📦 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Music APIs**: JioSaavn (primary), YouTube (fallback)
- **Storage**: Browser localStorage
- **Authentication**: Optional (Supabase ready)

## 🎯 Features in Detail

See [PLAYLIST_FEATURES.md](./PLAYLIST_FEATURES.md) for comprehensive playlist system documentation.

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to submit issues and pull requests.
