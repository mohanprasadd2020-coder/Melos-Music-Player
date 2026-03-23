export interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  image: string;
  url: string;
}

const BASE_URL = "https://saavn.dev/api";

function parseSong(item: any): Song {
  const images = item.image || [];
  const image = images.length > 0
    ? (images.find((i: any) => i.quality === "500x500") || images[images.length - 1])?.url || ""
    : "";

  const downloadUrls = item.downloadUrl || [];
  const audioUrl = downloadUrls.length > 0
    ? (downloadUrls.find((d: any) => d.quality === "320kbps") || downloadUrls[downloadUrls.length - 1])?.url || ""
    : "";

  const artists = item.artists?.primary?.map((a: any) => a.name).join(", ") 
    || item.primaryArtists 
    || "Unknown Artist";

  return {
    id: item.id,
    name: item.name || item.title || "Unknown",
    artist: artists,
    album: item.album?.name || item.album || "",
    duration: item.duration || 0,
    image,
    url: audioUrl,
  };
}

export async function searchSongs(query: string): Promise<Song[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${BASE_URL}/search/songs?query=${encodeURIComponent(query)}&limit=20`);
    const data = await res.json();
    if (!data.success || !data.data?.results) return [];
    return data.data.results.map(parseSong);
  } catch {
    return [];
  }
}

export async function getTrendingSongs(): Promise<Song[]> {
  try {
    const res = await fetch(`${BASE_URL}/search/songs?query=trending hindi&limit=20`);
    const data = await res.json();
    if (!data.success || !data.data?.results) return [];
    return data.data.results.map(parseSong);
  } catch {
    return [];
  }
}

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
