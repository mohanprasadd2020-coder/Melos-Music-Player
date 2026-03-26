const LYRICS_API = "https://lyricsapi.vercel.app/api";
const LYRICS_FALLBACK = "https://api.lyrics.ovh/v1";

export async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  // Clean up names
  const cleanArtist = artist.split(",")[0].trim().replace(/[^\w\s]/g, "");
  const cleanTitle = title.replace(/\(.*?\)/g, "").replace(/\[.*?\]/g, "").trim();

  // Try primary API
  try {
    const res = await fetch(`${LYRICS_FALLBACK}/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.lyrics) return data.lyrics;
    }
  } catch {}

  // Try secondary API
  try {
    const res = await fetch(`${LYRICS_API}?artist=${encodeURIComponent(cleanArtist)}&title=${encodeURIComponent(cleanTitle)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.lyrics) return data.lyrics;
    }
  } catch {}

  return null;
}
