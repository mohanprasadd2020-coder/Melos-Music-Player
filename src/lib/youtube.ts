/**
 * YouTube fallback via Piped API (no API key needed).
 * Searches for a song and returns a playable audio stream URL.
 */

import { Song } from "./api";

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.in.projectsegfau.lt",
];

let currentInstance = 0;

function getApi(): string {
  return PIPED_INSTANCES[currentInstance % PIPED_INSTANCES.length];
}

function rotateInstance() {
  currentInstance = (currentInstance + 1) % PIPED_INSTANCES.length;
}

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export interface YTSearchResult {
  videoId: string;
  title: string;
  uploaderName: string;
  duration: number; // seconds
  thumbnail: string;
}

/**
 * Search YouTube for a query via Piped.
 */
export async function ytSearch(query: string, limit = 20): Promise<YTSearchResult[]> {
  for (let attempt = 0; attempt < PIPED_INSTANCES.length; attempt++) {
    const api = getApi();
    try {
      console.log(`[YT] Searching "${query}" via ${api}`);
      const res = await fetchWithTimeout(
        `${api}/search?q=${encodeURIComponent(query)}&filter=music_songs`
      );
      if (!res.ok) {
        console.warn(`[YT] ${api} returned ${res.status}`);
        rotateInstance();
        continue;
      }
      const data = await res.json();
      const items = (data.items || [])
        .filter((item: any) => item.type === "stream" && item.url)
        .slice(0, limit)
        .map((item: any) => ({
          videoId: item.url?.replace("/watch?v=", "") || "",
          title: item.title || "Unknown",
          uploaderName: item.uploaderName || "Unknown",
          duration: item.duration || 0,
          thumbnail: item.thumbnail || "",
        }));
      console.log(`[YT] Found ${items.length} results`);
      return items;
    } catch (err) {
      console.warn(`[YT] ${api} failed:`, err);
      rotateInstance();
    }
  }
  console.error("[YT] All Piped instances failed for search");
  return [];
}

/**
 * Get a playable audio stream URL for a video ID via Piped.
 */
export async function ytGetAudioUrl(videoId: string): Promise<string | null> {
  for (let attempt = 0; attempt < PIPED_INSTANCES.length; attempt++) {
    const api = getApi();
    try {
      console.log(`[YT Fallback] Getting audio for ${videoId} via ${api}`);
      const res = await fetchWithTimeout(`${api}/streams/${videoId}`);
      if (!res.ok) {
        rotateInstance();
        continue;
      }
      const data = await res.json();

      // Try audio streams first (best quality)
      const audioStreams = (data.audioStreams || [])
        .filter((s: any) => s.mimeType?.startsWith("audio/"))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

      if (audioStreams.length > 0) {
        console.log(`[YT Fallback] Got audio stream (${audioStreams[0].quality})`);
        return audioStreams[0].url;
      }

      // Fallback to HLS
      if (data.hls) {
        console.log("[YT Fallback] Using HLS stream");
        return data.hls;
      }

      console.warn("[YT Fallback] No audio streams found in response");
      rotateInstance();
    } catch (err) {
      console.warn(`[YT Fallback] Stream fetch failed:`, err);
      rotateInstance();
    }
  }
  console.error("[YT Fallback] All instances failed for audio URL");
  return null;
}

/**
 * Full fallback: search YouTube and return a Song-compatible object.
 * Used when JioSaavn returns no playable URL.
 */
export async function ytFallbackSearch(songName: string, artist: string): Promise<Song | null> {
  const query = `${songName} ${artist}`.trim();
  console.log(`[YT Fallback] Triggering fallback for: "${query}"`);

  const results = await ytSearch(query);
  if (results.length === 0) {
    console.warn("[YT Fallback] No search results");
    return null;
  }

  const best = results[0];
  const audioUrl = await ytGetAudioUrl(best.videoId);
  if (!audioUrl) {
    console.warn("[YT Fallback] Could not get audio URL");
    return null;
  }

  console.log(`[YT Fallback] Success! Playing "${best.title}" from YouTube`);

  return {
    id: `yt_${best.videoId}`,
    name: best.title,
    artist: best.uploaderName,
    album: "YouTube Music",
    duration: best.duration,
    image: best.thumbnail,
    url: audioUrl,
    source: "saavn", // compatible source type
  };
}

/**
 * Validate whether a song has a playable URL.
 */
export function isSongPlayable(song: Song): boolean {
  return !!(song.url && song.url.trim().length > 0 && song.url !== "null" && song.url !== "undefined");
}

/**
 * Search YouTube and return Song[] (audio-only, no video).
 * Audio URL is resolved lazily on play to avoid rate limits.
 */
export async function ytSearchSongs(query: string): Promise<Song[]> {
  if (!query.trim()) return [];
  const results = await ytSearch(query, 20);
  return results.map((r) => ({
    id: `yt_${r.videoId}`,
    name: r.title,
    artist: r.uploaderName,
    album: "YouTube",
    duration: r.duration,
    image: r.thumbnail,
    url: "", // resolved on play via fallback
    source: "saavn" as const,
  }));
}

/**
 * Get trending/popular music from YouTube.
 */
export async function ytTrendingSongs(): Promise<Song[]> {
  const results = await ytSearch("trending music 2024 hits", 20);
  return results.map((r) => ({
    id: `yt_${r.videoId}`,
    name: r.title,
    artist: r.uploaderName,
    album: "YouTube",
    duration: r.duration,
    image: r.thumbnail,
    url: "",
    source: "saavn" as const,
  }));
}
