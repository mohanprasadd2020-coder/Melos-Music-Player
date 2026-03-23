import { useState, useRef, useCallback, useEffect } from "react";
import { Song, addToRecentlyPlayed } from "@/lib/api";

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("ended", () => handleNext());
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const playSong = useCallback((song: Song, playlist?: Song[], index?: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playlist && index !== undefined) {
      setQueue(playlist);
      setQueueIndex(index);
    }

    setCurrentSong(song);
    addToRecentlyPlayed(song);
    audio.src = song.url;
    audio.play().catch(() => {});
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    if (isPlaying) audio.pause();
    else audio.play().catch(() => {});
  }, [isPlaying, currentSong]);

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    playSong(queue[nextIdx], queue, nextIdx);
  }, [queue, queueIndex, playSong]);

  const handlePrev = useCallback(() => {
    if (queue.length === 0) return;
    const prevIdx = queueIndex <= 0 ? queue.length - 1 : queueIndex - 1;
    setQueueIndex(prevIdx);
    playSong(queue[prevIdx], queue, prevIdx);
  }, [queue, queueIndex, playSong]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
  }, []);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  return {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    playSong,
    togglePlay,
    handleNext,
    handlePrev,
    seek,
    changeVolume,
  };
}
