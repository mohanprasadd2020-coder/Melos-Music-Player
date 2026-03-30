const LYRICS_APIS = [
  // Primary APIs - Most reliable
  (artist: string, title: string) =>
    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
  (artist: string, title: string) =>
    `https://lyricsapi.vercel.app/api?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`,
  
  // Fallback APIs
  (artist: string, title: string) =>
    `https://lyrist.vercel.app/api/${encodeURIComponent(title)}/${encodeURIComponent(artist)}`,
  
  // Musixmatch API (good for Indian songs)
  (artist: string, title: string) =>
    `https://www.musixmatch.com/search/${encodeURIComponent(title)} ${encodeURIComponent(artist)}`,
];

// Cache for failed searches to avoid repeated API calls
const failedSearches = new Set<string>();

function getCacheKey(artist: string, title: string): string {
  return `${artist}::${title}`.toLowerCase();
}

export async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  // Check if we've already failed to find these lyrics
  const cacheKey = getCacheKey(artist, title);
  if (failedSearches.has(cacheKey)) {
    return null;
  }

  const cleanArtist = artist
    .split(",")[0]
    .split("&")[0]
    .trim()
    .replace(/[^\w\s]/g, "")
    .toLowerCase();
  
  const cleanTitle = title
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/-.*$/, "")
    .replace(/\|.*$/, "")
    .trim()
    .toLowerCase();

  // Attempt 1: Try with both artist and title
  for (const buildUrl of LYRICS_APIS.slice(0, 3)) {
    try {
      const url = buildUrl(cleanArtist, cleanTitle);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const lyrics = data.lyrics || data.lyric || data.lyrics_text;
        if (lyrics && typeof lyrics === 'string' && lyrics.trim().length > 20) {
          return lyrics.trim();
        }
      }
    } catch (e) {
      // API failed, try next
    }
  }

  // Attempt 2: Try with just the title
  for (const buildUrl of LYRICS_APIS.slice(0, 3)) {
    try {
      const url = buildUrl("", cleanTitle);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const lyrics = data.lyrics || data.lyric || data.lyrics_text;
        if (lyrics && typeof lyrics === 'string' && lyrics.trim().length > 20) {
          return lyrics.trim();
        }
      }
    } catch (e) {
      // API failed, try next
    }
  }

  // Attempt 3: Try with title without featured artists
  const superCleanTitle = cleanTitle
    .replace(/\s*feat\.?\s+/gi, " ")
    .replace(/\s*ft\.?\s+/gi, " ")
    .replace(/\s*\(\s*feat\.?\s+[^)]*\)/gi, "")
    .replace(/\s*\(\s*ft\.?\s+[^)]*\)/gi, "")
    .trim();
  
  if (superCleanTitle && superCleanTitle !== cleanTitle && superCleanTitle.length > 2) {
    for (const buildUrl of LYRICS_APIS.slice(0, 3)) {
      try {
        const url = buildUrl(cleanArtist, superCleanTitle);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          const lyrics = data.lyrics || data.lyric || data.lyrics_text;
          if (lyrics && typeof lyrics === 'string' && lyrics.trim().length > 20) {
            return lyrics.trim();
          }
        }
      } catch (e) {
        // API failed, try next
      }
    }
  }

  // Attempt 4: Try with first word of title only (for very long titles)
  const firstWordTitle = cleanTitle.split(/\s+/)[0];
  if (firstWordTitle && firstWordTitle.length > 2 && firstWordTitle !== cleanTitle) {
    for (const buildUrl of LYRICS_APIS.slice(0, 2)) {
      try {
        const url = buildUrl(cleanArtist, firstWordTitle);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          const lyrics = data.lyrics || data.lyric || data.lyrics_text;
          if (lyrics && typeof lyrics === 'string' && lyrics.trim().length > 20) {
            return lyrics.trim();
          }
        }
      } catch (e) {
        // API failed, try next
      }
    }
  }

  // Mark this search as failed to avoid future API calls
  failedSearches.add(cacheKey);
  return null;
}
