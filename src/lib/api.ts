export type SongSource = "saavn" | "local" | "youtube";

export interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  image: string;
  url: string;
  source?: SongSource;
}

export interface Album {
  id: string;
  name: string;
  year: string;
  artist: string;
  image: string;
  songCount: number;
  songs?: Song[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  image: string;
  songs: Song[];
  createdAt: number;
}

const BASE_URL = "https://jiosaavn-api-privatecvc2.vercel.app";

function parseSong(item: any): Song {
  const images = item.image || [];
  const image = images.length > 0
    ? (images.find((i: any) => i.quality === "500x500") || images[images.length - 1])?.link || ""
    : "";

  const downloadUrls = item.downloadUrl || [];
  const audioUrl = downloadUrls.length > 0
    ? (downloadUrls.find((d: any) => d.quality === "320kbps") || downloadUrls[downloadUrls.length - 1])?.link || ""
    : "";

  const artists = item.artists?.primary?.map((a: any) => a.name).join(", ")
    || item.primaryArtists
    || "Unknown Artist";

  return {
    id: item.id,
    name: item.name || item.title || "Unknown",
    artist: artists,
    album: item.album?.name || item.album || "",
    duration: parseInt(item.duration) || 0,
    image,
    url: audioUrl,
  };
}

function parseAlbum(item: any): Album {
  const images = item.image || [];
  const image = images.length > 0
    ? (images.find((i: any) => i.quality === "500x500") || images[images.length - 1])?.link || ""
    : "";

  const artist = item.primaryArtists
    ? (typeof item.primaryArtists === "string"
      ? item.primaryArtists
      : item.primaryArtists.map((a: any) => a.name).join(", "))
    : "Various Artists";

  return {
    id: item.id,
    name: item.name,
    year: item.year || "",
    artist,
    image,
    songCount: parseInt(item.songCount) || 0,
  };
}

// ─── Song APIs ───

export async function searchSongs(query: string): Promise<Song[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${BASE_URL}/search/songs?query=${encodeURIComponent(query)}&limit=50`);
    const data = await res.json();
    if (data.status !== "SUCCESS" || !data.data?.results) return [];
    return data.data.results.map(parseSong);
  } catch {
    return [];
  }
}

export async function getTrendingSongs(): Promise<Song[]> {
  try {
    const res = await fetch(`${BASE_URL}/search/songs?query=trending hindi&limit=20`);
    const data = await res.json();
    if (data.status !== "SUCCESS" || !data.data?.results) return [];
    return data.data.results.map(parseSong);
  } catch {
    return [];
  }
}

// ─── Album APIs ───

export async function searchAlbums(query: string): Promise<Album[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${BASE_URL}/search/albums?query=${encodeURIComponent(query)}&limit=40`);
    const data = await res.json();
    if (data.status !== "SUCCESS" || !data.data?.results) return [];
    return data.data.results.map(parseAlbum);
  } catch {
    return [];
  }
}

export async function getAlbumDetails(albumId: string): Promise<Album | null> {
  try {
    const res = await fetch(`${BASE_URL}/albums?id=${albumId}`);
    const data = await res.json();
    if (data.status !== "SUCCESS" || !data.data) return null;
    const album = parseAlbum(data.data);
    album.songs = (data.data.songs || []).map(parseSong);
    return album;
  } catch {
    return null;
  }
}

export async function getTrendingAlbums(): Promise<Album[]> {
  try {
    const res = await fetch(`${BASE_URL}/search/albums?query=new hindi 2024&limit=10`);
    const data = await res.json();
    if (data.status !== "SUCCESS" || !data.data?.results) return [];
    return data.data.results.map(parseAlbum);
  } catch {
    return [];
  }
}

// ─── Playlist (localStorage) ───

export function getPlaylists(): Playlist[] {
  try {
    return JSON.parse(localStorage.getItem("playlists") || "[]");
  } catch {
    return [];
  }
}

function savePlaylists(playlists: Playlist[]) {
  localStorage.setItem("playlists", JSON.stringify(playlists));
}

export function createPlaylist(name: string, description = ""): Playlist {
  const playlists = getPlaylists();
  const playlist: Playlist = {
    id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    description,
    image: "",
    songs: [],
    createdAt: Date.now(),
  };
  playlists.unshift(playlist);
  savePlaylists(playlists);
  return playlist;
}

export function deletePlaylist(playlistId: string) {
  const playlists = getPlaylists().filter(p => p.id !== playlistId);
  savePlaylists(playlists);
}

export function addSongToPlaylist(playlistId: string, song: Song): boolean {
  const playlists = getPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return false;
  if (playlist.songs.some(s => s.id === song.id)) return false;
  playlist.songs.push(song);
  if (!playlist.image && song.image) playlist.image = song.image;
  savePlaylists(playlists);
  return true;
}

export function removeSongFromPlaylist(playlistId: string, songId: string) {
  const playlists = getPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return;
  playlist.songs = playlist.songs.filter(s => s.id !== songId);
  savePlaylists(playlists);
}

export function getPlaylistById(playlistId: string): Playlist | null {
  return getPlaylists().find(p => p.id === playlistId) || null;
}

export function searchPlaylists(query: string): Playlist[] {
  if (!query.trim()) return getPlaylists();
  const q = query.toLowerCase();
  return getPlaylists().filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.songs.some(s => s.name.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
  );
}

// ─── Recently Played & Favorites ───

export function getRecentlyPlayed(): Song[] {
  try {
    return JSON.parse(localStorage.getItem("recentlyPlayed") || "[]");
  } catch {
    return [];
  }
}

export function addToRecentlyPlayed(song: Song) {
  const recent = getRecentlyPlayed().filter((s) => s.id !== song.id);
  recent.unshift(song);
  localStorage.setItem("recentlyPlayed", JSON.stringify(recent.slice(0, 20)));
}

export function getFavorites(): Song[] {
  try {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
  } catch {
    return [];
  }
}

export function toggleFavorite(song: Song): boolean {
  const favs = getFavorites();
  const exists = favs.some((s) => s.id === song.id);
  if (exists) {
    localStorage.setItem("favorites", JSON.stringify(favs.filter((s) => s.id !== song.id)));
    return false;
  } else {
    favs.unshift(song);
    localStorage.setItem("favorites", JSON.stringify(favs));
    return true;
  }
}

export function isFavorite(songId: string): boolean {
  return getFavorites().some((s) => s.id === songId);
}

// ─── Database-Backed Favorites & Recently Played ───

export async function getFavoritesForUser(userId: string | undefined): Promise<Song[]> {
  if (!userId) return getFavorites();
  
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("song_data")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
      
    if (error || !data) return getFavorites();
    
    // Save to local cache
    const songs = data.map(d => d.song_data as unknown as Song);
    localStorage.setItem("favorites", JSON.stringify(songs));
    return songs;
  } catch (err) {
    return getFavorites();
  }
}

export async function toggleFavoriteForUser(song: Song, userId: string | undefined): Promise<boolean> {
  const isFav = toggleFavorite(song); // optimistic local update

  if (!userId) return isFav;

  try {
    if (isFav) {
      await supabase.from("favorites").insert({
        user_id: userId,
        song_id: song.id,
        song_data: song as any
      });
    } else {
      await supabase.from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("song_id", song.id);
    }
  } catch (err) {
    console.error("[Favorites] DB sync error", err);
  }

  return isFav;
}

export async function getRecentlyPlayedForUser(userId: string | undefined): Promise<Song[]> {
  if (!userId) return getRecentlyPlayed();
  
  try {
    const { data, error } = await supabase
      .from("recently_played")
      .select("song_data")
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .limit(20);
      
    if (error || !data) return getRecentlyPlayed();
    
    const songs = data.map(d => d.song_data as unknown as Song);
    localStorage.setItem("recentlyPlayed", JSON.stringify(songs));
    return songs;
  } catch (err) {
    return getRecentlyPlayed();
  }
}

export async function addToRecentlyPlayedForUser(song: Song, userId: string | undefined) {
  addToRecentlyPlayed(song); // optimistic local update
  
  if (!userId) return;

  try {
    // Delete existing to update timestamp
    await supabase.from("recently_played")
      .delete()
      .eq("user_id", userId)
      .eq("song_id", song.id);
      
    await supabase.from("recently_played").insert({
      user_id: userId,
      song_id: song.id,
      song_data: song as any,
      played_at: new Date().toISOString()
    });
    
    // Keep only last 20
    const { data } = await supabase.from("recently_played")
      .select("id")
      .eq("user_id", userId)
      .order("played_at", { ascending: false })
      .range(20, 100);
      
    if (data && data.length > 0) {
      await supabase.from("recently_played")
        .delete()
        .in("id", data.map(d => d.id));
    }
  } catch (err) {
    console.error("[Recent] DB sync error", err);
  }
}

// ─── Database-Backed Recent Searches ───

export async function getRecentSearchesForUser(userId: string | undefined): Promise<string[]> {
  if (!userId) {
    const saved = localStorage.getItem("melos_recent_searches");
    return saved ? JSON.parse(saved) : [];
  }
  
  try {
    const { data, error } = await supabase
      .from("recent_searches")
      .select("query")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
      
    if (error || !data) return [];
    
    const searches = data.map(d => d.query);
    localStorage.setItem("melos_recent_searches", JSON.stringify(searches));
    return searches;
  } catch (err) {
    return [];
  }
}

export async function saveRecentSearchForUser(query: string, userId: string | undefined) {
  if (!query.trim()) return;
  
  // Local update
  const saved = localStorage.getItem("melos_recent_searches");
  const recent = saved ? JSON.parse(saved) : [];
  const updated = [query, ...recent.filter((t: string) => t !== query)].slice(0, 10);
  localStorage.setItem("melos_recent_searches", JSON.stringify(updated));

  if (!userId) return;

  try {
    // Delete existing to update timestamp
    await supabase.from("recent_searches")
      .delete()
      .eq("user_id", userId)
      .eq("query", query);
      
    await supabase.from("recent_searches").insert({
      user_id: userId,
      query: query,
    });
    
    // Keep only last 10
    const { data } = await supabase.from("recent_searches")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(10, 50);
      
    if (data && data.length > 0) {
      await supabase.from("recent_searches")
        .delete()
        .in("id", data.map(d => d.id));
    }
  } catch (err) {
    console.error("[Recent Search] DB sync error", err);
  }
}

export async function clearRecentSearchesForUser(userId: string | undefined) {
  localStorage.removeItem("melos_recent_searches");
  
  if (!userId) return;

  try {
    await supabase.from("recent_searches")
      .delete()
      .eq("user_id", userId);
  } catch (err) {
    console.error("[Recent Search] DB clear error", err);
  }
}


// ─── Database-Backed Playlists (User-Specific) ───

import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all playlists for a specific user from the database
 * Falls back to localStorage if no user or database error
 */
export async function getPlaylistsForUser(userId: string | undefined): Promise<Playlist[]> {
  // If no user, return localStorage playlists
  if (!userId) {
    console.log("[Playlists] No user ID provided, using localStorage");
    return getPlaylists();
  }

  try {
    console.log("[Playlists] Fetching playlists for user:", userId);
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Playlists] Database fetch error:", error);
      console.log("[Playlists] Falling back to localStorage");
      return getPlaylists();
    }

    if (!data || data.length === 0) {
      console.log("[Playlists] No playlists found in database for user");
      return [];
    }

    // Convert database rows to Playlist objects
    const playlists: Playlist[] = data.map((row: any) => ({
      id: row.playlist_id,
      name: row.name,
      description: row.description || "",
      image: row.image || "",
      songs: Array.isArray(row.songs) ? row.songs : [],
      createdAt: new Date(row.created_at).getTime(),
    }));

    console.log("[Playlists] Successfully fetched user playlists:", playlists.length);
    return playlists;
  } catch (err) {
    console.error("[Playlists] Unexpected error fetching playlists:", err);
    console.log("[Playlists] Falling back to localStorage");
    return getPlaylists();
  }
}

/**
 * Create a new playlist for user and save to database
 */
export async function createPlaylistForUser(name: string, userId: string | undefined, description = ""): Promise<Playlist> {
  const playlist: Playlist = {
    id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    description,
    image: "",
    songs: [],
    createdAt: Date.now(),
  };

  // Always save to localStorage for offline support
  const playlists = getPlaylists();
  playlists.unshift(playlist);
  savePlaylists(playlists);

  // Try to save to database if user is authenticated
  if (!userId) {
    console.log("[Playlists] No user ID, playlist saved to localStorage only");
    return playlist;
  }

  try {
    console.log("[Playlists] Saving new playlist to database:", playlist.id);
    const { error } = await supabase
      .from("playlists")
      .insert({
        user_id: userId,
        playlist_id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        image: playlist.image,
        songs: playlist.songs as any,
      });

    if (error) {
      console.error("[Playlists] Failed to save to database:", error);
      return playlist;
    }

    console.log("[Playlists] Playlist saved to database successfully");
  } catch (err) {
    console.error("[Playlists] Error saving playlist to database:", err);
  }

  return playlist;
}

/**
 * Delete a playlist from both database and localStorage
 */
export async function deletePlaylistForUser(playlistId: string, userId: string | undefined): Promise<void> {
  // Delete from localStorage
  const playlists = getPlaylists().filter(p => p.id !== playlistId);
  savePlaylists(playlists);

  // Delete from database if user is authenticated
  if (!userId) {
    console.log("[Playlists] No user ID, deleted from localStorage only");
    return;
  }

  try {
    console.log("[Playlists] Deleting playlist from database:", playlistId);
    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("user_id", userId);

    if (error) {
      console.error("[Playlists] Failed to delete from database:", error);
      return;
    }

    console.log("[Playlists] Playlist deleted from database successfully");
  } catch (err) {
    console.error("[Playlists] Error deleting playlist from database:", err);
  }
}

/**
 * Rename a playlist in both database and localStorage
 */
export async function renamePlaylistForUser(playlistId: string, newName: string, userId: string | undefined): Promise<void> {
  // Update localStorage
  const playlists = getPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  if (playlist) {
    playlist.name = newName;
    savePlaylists(playlists);
  }

  // Update in database if user is authenticated
  if (!userId) {
    return;
  }

  try {
    const { error } = await supabase
      .from("playlists")
      .update({ name: newName })
      .eq("playlist_id", playlistId)
      .eq("user_id", userId);

    if (error) {
      console.error("[Playlists] Failed to rename in database:", error);
    }
  } catch (err) {
    console.error("[Playlists] Error renaming playlist in database:", err);
  }
}

/**
 * Add a song to a playlist in both database and localStorage
 * Returns: false if song already exists, true if successfully added
 */
export async function addSongToPlaylistForUser(playlistId: string, song: Song, userId: string | undefined): Promise<boolean> {
  // Update localStorage
  const playlists = getPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) {
    console.warn("[Playlists] Playlist not found:", playlistId);
    return false;
  }
  
  // Check if song already exists
  const songExists = playlist.songs.some(s => s.id === song.id);
  if (songExists) {
    console.log("[Playlists] Song already in playlist:", playlistId, song.id);
    return false;
  }
  
  // Add song to playlist
  const updatedSongs = [...playlist.songs, song];
  playlist.songs = updatedSongs;
  
  // Update playlist image if needed
  if (!playlist.image && song.image) {
    playlist.image = song.image;
  }
  
  savePlaylists(playlists);
  console.log("[Playlists] Song added to localStorage playlist:", playlistId, song.id);

  // Update database if user is authenticated
  if (!userId) {
    console.log("[Playlists] No user ID, song added to localStorage only");
    return true;
  }

  try {
    console.log("[Playlists] Updating playlist in database:", playlistId, "with", updatedSongs.length, "songs");
    const { error } = await supabase
      .from("playlists")
      .update({
        songs: updatedSongs as any,
        image: playlist.image,
        updated_at: new Date().toISOString(),
      })
      .eq("playlist_id", playlistId)
      .eq("user_id", userId);

    if (error) {
      console.error("[Playlists] Failed to add song to database:", error);
      return true; // Still return true since localStorage was updated
    }

    console.log("[Playlists] Song added to playlist in database successfully");
    return true;
  } catch (err) {
    console.error("[Playlists] Error adding song to database:", err);
    return true; // Still return true since localStorage was updated
  }
}

/**
 * Remove a song from a playlist in both database and localStorage
 */
export async function removeSongFromPlaylistForUser(playlistId: string, songId: string, userId: string | undefined): Promise<void> {
  // Update localStorage
  const playlists = getPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return;
  
  playlist.songs = playlist.songs.filter(s => s.id !== songId);
  savePlaylists(playlists);

  // Update database if user is authenticated
  if (!userId) {
    console.log("[Playlists] No user ID, song removed from localStorage only");
    return;
  }

  try {
    console.log("[Playlists] Removing song from playlist in database:", playlistId, songId);
    const { error } = await supabase
      .from("playlists")
      .update({
        songs: playlist.songs as any,
        updated_at: new Date().toISOString(),
      })
      .eq("playlist_id", playlistId)
      .eq("user_id", userId);

    if (error) {
      console.error("[Playlists] Failed to remove song from database:", error);
      return;
    }

    console.log("[Playlists] Song removed from playlist in database successfully");
  } catch (err) {
    console.error("[Playlists] Error removing song from database:", err);
  }
}

/**
 * Migrate playlists from localStorage to database for authenticated user
 * Called on login to sync local data to cloud
 */
export async function migratePlaylistsToDatabase(userId: string): Promise<void> {
  if (!userId) return;

  try {
    console.log("[Playlists] Starting migration from localStorage to database for user:", userId);
    
    // Get playlists from localStorage
    const localPlaylists = getPlaylists();
    
    if (localPlaylists.length === 0) {
      console.log("[Playlists] No local playlists to migrate");
      return;
    }

    // Check if user already has playlists in database
    const { data: existingPlaylists, error: fetchError } = await supabase
      .from("playlists")
      .select("playlist_id")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("[Playlists] Error checking existing playlists:", fetchError);
      return;
    }

    const existingIds = new Set((existingPlaylists || []).map(p => p.playlist_id));

    // Filter out playlists that already exist in database
    const playlistsToMigrate = localPlaylists.filter(p => !existingIds.has(p.id));

    if (playlistsToMigrate.length === 0) {
      console.log("[Playlists] All local playlists already exist in database");
      return;
    }

    console.log("[Playlists] Migrating playlists to database:", playlistsToMigrate.length);

    // Insert all new playlists
    const { error: insertError } = await supabase
      .from("playlists")
      .insert(
        playlistsToMigrate.map(p => ({
          user_id: userId,
          playlist_id: p.id,
          name: p.name,
          description: p.description,
          image: p.image,
          songs: p.songs as any,
        }))
      );

    if (insertError) {
      console.error("[Playlists] Error migrating playlists:", insertError);
      return;
    }

    console.log("[Playlists] Successfully migrated", playlistsToMigrate.length, "playlists to database");
  } catch (err) {
    console.error("[Playlists] Unexpected error during migration:", err);
  }
}

/**
 * Verify that a playlist was saved to database (for debugging)
 */
export async function verifyPlaylistInDatabase(playlistId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("playlist_id", playlistId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.warn("[Playlists] Playlist verification failed:", error);
      return false;
    }

    if (!data) {
      console.warn("[Playlists] Playlist not found in database:", playlistId);
      return false;
    }

    console.log("[Playlists] Playlist verified in database:", {
      id: playlistId,
      name: data.name,
      songs: Array.isArray(data.songs) ? data.songs.length : 0,
      updatedAt: data.updated_at,
    });
    return true;
  } catch (err) {
    console.error("[Playlists] Error verifying playlist:", err);
    return false;
  }
}
