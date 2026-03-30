# Quick Start Guide - JioSaavn Jam

## 🎯 Getting Started (30 seconds)

1. **Open the app**: http://localhost:8080/
2. **Search for a song**: Use search bar at the top
3. **Click to play**: Any song card starts playback
4. **Add to playlist**:
   - Click three-dot menu (⋯) on song
   - Select "Add to Playlist"
   - Pick a playlist (or create new one)

## 📚 Step-by-Step Tutorials

### Tutorial 1: Create Your First Playlist

```
1. Sidebar → Click "Playlists"
2. Click blue "New" button
3. Type playlist name (e.g., "My Favorites")
4. Press Enter or click Create
5. Playlist created! ✓
```

### Tutorial 2: Add Songs to Playlist

```
1. Go to Home or Search
2. Find a song you like
3. Click the three-dot menu (⋯) on the song
4. Click "Add to Playlist"
5. Choose your playlist
6. Song added! ✓
```

### Tutorial 3: Play a Playlist

```
OPTION A - Play All:
1. Sidebar → Playlists
2. Click any playlist card to open it
3. Click blue "Play All" button
4. Plays all songs in order ✓

OPTION B - Play From Song:
1. Open playlist (same as above)
2. Click any song in the list
3. Plays from that song onwards ✓
```

### Tutorial 4: Remove Songs from Playlist

```
1. Open playlist → click a playlist card
2. Find song you want to remove
3. Click trash icon (🗑️) on the right
4. Song removed from playlist only ✓
```

### Tutorial 5: Delete Entire Playlist

```
1. Go to Playlists view
2. Hover over playlist card
3. Click three-dot menu (⋯)
4. Click "Delete"
5. Playlist permanently removed ✓
```

## 🎮 Player Controls

| Control           | Action                           |
| ----------------- | -------------------------------- |
| **Play Button**   | Play/pause current song          |
| **< >**           | Previous/Next track              |
| **🔀**            | Toggle Shuffle                   |
| **🔁**            | Toggle Repeat (Off → All → One)  |
| **Volume Slider** | Adjust volume                    |
| **Song Info**     | Click to open full-screen player |
| **☰ (Menu)**     | Show queue (desktop)             |

## 💡 Pro Tips

✅ **Duplicate Prevention**: Can't add same song twice to playlist
✅ **Auto-Save**: All changes saved to browser localStorage
✅ **Persistent**: Playlists survive browser close/refresh
✅ **Search**: Sidebar has playlist search field
✅ **Mobile**: All features work on phone/tablet
✅ **YouTube Fallback**: If JioSaavn not available, tries YouTube
✅ **Favorites**: Heart icon on every song, "Liked Songs" in sidebar
✅ **History**: "Recently Played" auto-tracks what you hear

## ❓ Common Questions

**Q: Where is my data stored?**
A: In your browser's localStorage (100% local, no cloud)

**Q: Does playlist sync across devices?**
A: No, each browser is separate. Use same browser for consistency.

**Q: Can I delete songs without deleting playlist?**
A: Yes! Delete song from playlist view with trash icon. Doesn't affect other playlists.

**Q: What if JioSaavn song won't play?**
A: Automatically tries YouTube. If both fail, try different song.

**Q: How do I clear all playlists?**
A: Developer Tools → Application → localStorage → Delete "playlists" key

**Q: Can I export/backup playlists?**
A: Yes! In console: `copy(JSON.stringify(JSON.parse(localStorage.getItem('playlists'))))`
Then paste to file and save.

**Q: Can I import playlists from Spotify/Apple Music?**
A: Not yet, but you can manually add songs via search.

## 🎵 Music Sources

1. **JioSaavn**: Primary source (Indian music, 70M+ songs)
2. **YouTube**: Fallback if JioSaavn unavailable
3. **Local Files**: Upload MP3, WAV, etc. from your device
4. **YouTube Music**: Dedicated YouTube search section

## 📱 Mobile Differences

**On Phone/Tablet:**

- Sidebar hidden (swipe or menu icon to expand)
- Bottom mobile nav for quick access
- Full-screen player when playing
- Same features, optimized for touch

## 🔐 Privacy & Security

✅ No signup required  
✅ No data sent to server (except music)  
✅ All playlists stored locally in browser  
✅ Can be cleared anytime from settings  
✅ No tracking or analytics (optional auth only)

## 🌐 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 90+
- ✅ Safari 14+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile

## 🎬 Demo Video Script

1. Search for "Bollywood hits" 2. Click any song to play 3. Open context menu (three dots) 4. Create new playlist "Road Trip" 5. Add 5 songs to playlist 6. Go to Playlists → open "Road Trip" 7. Click "Play All" 8. Use shuffle/repeat buttons 9. Switch to next song 10. Back to home → see "Your Playlists" section

## 🚀 Next Steps

- ✅ Create your first playlist
- ✅ Add your favorite songs
- ✅ Try shuffle and repeat modes
- ✅ Explore albums and trending
- ✅ Mark songs as favorites (heart)
- ✅ Upload local audio files
- ✅ Search YouTube Music section

## 📞 Support

If something doesn't work:

1. Hit F12 → Console → Check for errors
2. Clear browser cache
3. Try different song (in case unavailable)
4. Refresh page and try again

Enjoy your music! 🎵
