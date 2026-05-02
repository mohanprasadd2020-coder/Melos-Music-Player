/**
 * YouTube fallback via Piped API (no API key needed).
 * Searches for a song and returns a playable audio stream URL.
 */

import { Song } from "./api";

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.in.projectsegfau.lt",
  "https://pipedapi.mha.fi",
  "https://api.piped.video",
  "https://pipedapi.leptons.xyz",
  "https://md-piped-api.herokuapp.com",
];

let currentInstance = 0;

interface PipeSearchItem {
  type?: string;
  url?: string;
  id?: string;
  title?: string;
  uploaderName?: string;
  duration?: number;
  thumbnail?: string;
}

interface PipeStream {
  mimeType?: string;
  url?: string;
  bitrate?: number;
  quality?: string;
  qualityLabel?: string;
}

interface PipeStreamsResponse {
  audioStreams?: PipeStream[];
  videoStreams?: PipeStream[];
  hls?: string;
}

function getApi(): string {
  return PIPED_INSTANCES[currentInstance % PIPED_INSTANCES.length];
}

function rotateInstance() {
  currentInstance = (currentInstance + 1) % PIPED_INSTANCES.length;
}

function scoreStream(stream: PipeStream): number {
  const bitrate = Number(stream?.bitrate) || 0;
  const quality = typeof stream?.quality === "string" ? Number.parseInt(stream.quality, 10) || 0 : 0;
  const qualityLabel = typeof stream?.qualityLabel === "string"
    ? Number.parseInt(stream.qualityLabel, 10) || 0
    : 0;

  const audioOnlyBonus = stream?.mimeType?.startsWith("audio/") ? 2_000_000 : 0;
  const videoAudioBonus = stream?.mimeType?.includes("audio") ? 500_000 : 0;
  const hqPenalty = /preview|low|tiny|144p|240p/i.test(`${stream?.quality || ""} ${stream?.qualityLabel || ""}`) ? -2_000_000 : 0;

  return bitrate + quality + qualityLabel + audioOnlyBonus + videoAudioBonus + hqPenalty;
}

async function fetchWithTimeout(url: string, ms = 15000): Promise<Response> {
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
export async function ytSearch(query: string, limit = 50): Promise<YTSearchResult[]> {
  if (!query.trim()) return [];
  
  for (let attempt = 0; attempt < PIPED_INSTANCES.length; attempt++) {
    const api = getApi();
    try {
      console.log(`[YT Search] Query: "${query}" via ${api}`);
      
      // Try with music filter first
      let res = await fetchWithTimeout(
        `${api}/search?q=${encodeURIComponent(query)}&filter=music_songs`,
        8000
      );
      
      // If music filter fails, try general search
      if (!res.ok || res.status === 404) {
        console.log(`[YT Search] Music filter (${res.status}), trying general search`);
        res = await fetchWithTimeout(
          `${api}/search?q=${encodeURIComponent(query)}`,
          8000
        );
      }
      
      if (!res.ok) {
        console.warn(`[YT Search] ${api} returned ${res.status}`);
        rotateInstance();
        continue;
      }
      
      const data = (await res.json()) as { items?: PipeSearchItem[] };
      const items = (data.items || [])
        .filter((item: PipeSearchItem) => {
          // Filter for valid streams/videos
          return (item.type === "stream" || item.type === "video") && 
                 (item.url || item.id) &&
                 item.title;
        })
        .slice(0, limit)
        .map((item: PipeSearchItem) => {
          let videoId = "";
          if (item.url) {
            // Extract video ID from URL
            const match = item.url.match(/v=([^&]+)/);
            videoId = match ? match[1] : item.url.replace("/watch?v=", "");
          } else if (item.id) {
            videoId = item.id;
          }
          
          return {
            videoId: videoId.trim(),
            title: (item.title || "Unknown").trim(),
            uploaderName: (item.uploaderName || "Unknown").trim(),
            duration: item.duration || 0,
            thumbnail: item.thumbnail || "",
          };
        })
        .filter(item => item.videoId && item.videoId.length > 1);
      
      console.log(`[YT Search] Found ${items.length} valid results from ${api}`);
      
      if (items.length > 0) {
        return items;
      }
      rotateInstance();
    } catch (err) {
      console.warn(`[YT Search] ${api} failed:`, err instanceof Error ? err.message : err);
      rotateInstance();
    }
  }
  console.error("[YT Search] All instances exhausted, no results found");
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
      const res = await fetchWithTimeout(`${api}/streams/${videoId}`, 8000);
      if (!res.ok) {
        console.warn(`[YT Fallback] ${api} returned ${res.status}`);
        rotateInstance();
        continue;
      }
      // Ensure we received JSON; some instances return HTML/service pages on error
      const contentType = res.headers.get?.("content-type") || "";
      if (!contentType.includes("application/json") && !contentType.includes("application/octet-stream") && !contentType.includes("application/")) {
        console.warn(`[YT Fallback] ${api} responded with non-JSON content-type: ${contentType}`);
        rotateInstance();
        continue;
      }

      const data = (await res.json()) as PipeStreamsResponse;

      // Priority 1: Try audio-only streams (best quality, lowest bandwidth)
      const audioStreams = (data.audioStreams || [])
        .filter((s: PipeStream) => s.mimeType && s.mimeType.startsWith("audio/") && s.url)
        .sort((a: PipeStream, b: PipeStream) => scoreStream(b) - scoreStream(a));

      if (audioStreams.length > 0) {
        const url = audioStreams[0].url;
        console.log(`[YT Fallback] Got audio stream from ${api} (${audioStreams[0].quality || 'unknown'})`);
        return url;
      }

      // Priority 2: Try video streams with audio (if audio-only unavailable)
      const videoStreams = (data.videoStreams || [])
        .filter((s: PipeStream) => s.mimeType && s.mimeType.includes("video") && s.url && s.mimeType.includes("audio"))
        .sort((a: PipeStream, b: PipeStream) => scoreStream(b) - scoreStream(a));

      if (videoStreams.length > 0) {
        const url = videoStreams[0].url;
        console.log(`[YT Fallback] Got video-audio stream from ${api}`);
        return url;
      }

      // Priority 3: Try HLS stream (live streams or others)
      if (data.hls && typeof data.hls === 'string' && data.hls.startsWith('http')) {
        console.log(`[YT Fallback] Using HLS stream from ${api}`);
        return data.hls;
      }

      console.warn(`[YT Fallback] No valid audio streams found from ${api}`);
      rotateInstance();
    } catch (err) {
      console.warn(`[YT Fallback] Error fetching from ${api}:`, err instanceof Error ? err.message : err);
      rotateInstance();
    }
  }
  console.error("[YT Fallback] All Piped instances failed to get audio URL");
  return null;
}

/**
 * Full fallback: search YouTube and return a Song-compatible object.
 * Used when JioSaavn returns no playable URL.
 */
export async function ytFallbackSearch(songName: string, artist: string): Promise<Song | null> {
  const query = `${songName} ${artist}`.trim();
  console.log(`[YT Fallback] Searching for: "${query}"`);

  try {
    const results = await ytSearch(query, 5); // Get top 5 results
    if (results.length === 0) {
      console.warn("[YT Fallback] No search results found");
      
      // Try just the song name as last resort
      const nameOnlyResults = await ytSearch(songName, 3);
      if (nameOnlyResults.length === 0) {
        console.error("[YT Fallback] No results even with song name only");
        return null;
      }
      
      // Try to get audio from the first name-only result
      const audioUrl = await ytGetAudioUrl(nameOnlyResults[0].videoId);
      if (!audioUrl) {
        console.error("[YT Fallback] Could not get audio URL for name-only result");
        return null;
      }

      console.log(`[YT Fallback] Using name-only result: "${nameOnlyResults[0].title}"`);
      return {
        id: `yt_${nameOnlyResults[0].videoId}`,
        name: nameOnlyResults[0].title,
        artist: nameOnlyResults[0].uploaderName,
        album: "YouTube Music",
        duration: nameOnlyResults[0].duration,
        image: nameOnlyResults[0].thumbnail,
        url: audioUrl,
          source: "youtube",
      };
    }

    // Try each result until we find one with a valid audio URL
    for (const result of results) {
      console.log(`[YT Fallback] Trying: "${result.title}"`);
      const audioUrl = await ytGetAudioUrl(result.videoId);
      if (audioUrl) {
        console.log(`[YT Fallback] ✓ Success! Using: "${result.title}"`);
        return {
          id: `yt_${result.videoId}`,
          name: result.title,
          artist: result.uploaderName,
          album: "YouTube Music",
          duration: result.duration,
          image: result.thumbnail,
          url: audioUrl,
          source: "youtube",
        };
      }
      console.warn(`[YT Fallback] ✗ No audio URL for "${result.title}", trying next...`);
    }

    console.error("[YT Fallback] Could not get audio URL for any search result");
    return null;
  } catch (error) {
    console.error("[YT Fallback] Unexpected error:", error instanceof Error ? error.message : error);
    return null;
  }
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
  const results = await ytSearch(query, 50);
  return results.map((r) => ({
    id: `yt_${r.videoId}`,
    name: r.title,
    artist: r.uploaderName,
    album: "YouTube",
    duration: r.duration,
    image: r.thumbnail,
    url: "", // resolved on play via fallback
    source: "youtube" as const,
  }));
}

/**
 * Get trending/popular music from YouTube.
 */
export async function ytTrendingSongs(): Promise<Song[]> {
  const results = await ytSearch("trending music 2024 hits", 50);
  return results.map((r) => ({
    id: `yt_${r.videoId}`,
    name: r.title,
    artist: r.uploaderName,
    album: "YouTube",
    duration: r.duration,
    image: r.thumbnail,
    url: "",
    source: "youtube" as const,
  }));
}
