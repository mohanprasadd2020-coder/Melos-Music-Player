import { Song } from "./api";

function cleanFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "") // remove extension
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function processLocalFiles(files: FileList): Song[] {
  const songs: Song[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith("audio/")) continue;

    const blobUrl = URL.createObjectURL(file);
    const name = cleanFilename(file.name);

    songs.push({
      id: `local_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      artist: "Local File",
      album: "My Device",
      duration: 0, // will be resolved by audio element
      image: "",
      url: blobUrl,
      source: "local",
    });
  }

  return songs;
}
