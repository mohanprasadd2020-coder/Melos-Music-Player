export interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  image: string;
  url: string;
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
    const res = await fetch(`${BASE_URL}/search/songs?query=${encodeURIComponent(query)}&limit=20`);
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
    const res = await fetch(`${BASE_URL}/search/albums?query=${encodeURIComponent(query)}&limit=20`);
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
