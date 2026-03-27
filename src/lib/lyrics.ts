const LYRICS_APIS = [
  (artist: string, title: string) =>
    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
  (artist: string, title: string) =>
    `https://lyricsapi.vercel.app/api?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`,
  (artist: string, title: string) =>
    `https://lyrist.vercel.app/api/${encodeURIComponent(title)}/${encodeURIComponent(artist)}`,
];

export async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  const cleanArtist = artist.split(",")[0].trim().replace(/[^\w\s]/g, "");
  const cleanTitle = title
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/-.*$/, "")
    .trim();

  for (const buildUrl of LYRICS_APIS) {
    try {
      const url = buildUrl(cleanArtist, cleanTitle);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const lyrics = data.lyrics || data.lyric;
        if (lyrics && lyrics.trim().length > 20) return lyrics;
      }
    } catch {}
  }

  // Try with just the title (common for Indian songs)
  for (const buildUrl of LYRICS_APIS) {
    try {
      const url = buildUrl("", cleanTitle);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const lyrics = data.lyrics || data.lyric;
        if (lyrics && lyrics.trim().length > 20) return lyrics;
      }
    } catch {}
  }

  return null;
}
