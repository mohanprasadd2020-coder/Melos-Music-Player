import { useState, useRef, useCallback, useEffect } from "react";
import { Song, addToRecentlyPlayed } from "@/lib/api";
import { isSongPlayable, ytFallbackSearch } from "@/lib/youtube";
import { toast } from "sonner";

export type RepeatMode = "off" | "all" | "one";

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);

  const buildShuffleOrder = useCallback((length: number, currentIdx: number) => {
    const indices = Array.from({ length }, (_, i) => i).filter(i => i !== currentIdx);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return [currentIdx, ...indices];
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Handle song end based on repeat mode
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        handleNext();
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [repeat, queue, queueIndex, shuffle, shuffleOrder]);

  const playSong = useCallback((song: Song, playlist?: Song[], index?: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playlist && index !== undefined) {
      setQueue(playlist);
      setQueueIndex(index);
      if (shuffle) {
        setShuffleOrder(buildShuffleOrder(playlist.length, index));
      }
    }

    setCurrentSong(song);
    addToRecentlyPlayed(song);
    audio.src = song.url;
    audio.play().catch(() => {});
  }, [shuffle, buildShuffleOrder]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    if (isPlaying) audio.pause();
    else audio.play().catch(() => {});
  }, [isPlaying, currentSong]);

  const getNextIndex = useCallback((direction: 1 | -1) => {
    if (queue.length === 0) return -1;

    if (shuffle && shuffleOrder.length > 0) {
      const currentShufflePos = shuffleOrder.indexOf(queueIndex);
      let nextPos = currentShufflePos + direction;
      if (nextPos >= shuffleOrder.length) {
        if (repeat === "all") nextPos = 0;
        else return -1;
      }
      if (nextPos < 0) {
        if (repeat === "all") nextPos = shuffleOrder.length - 1;
        else return -1;
      }
      return shuffleOrder[nextPos];
    }

    let nextIdx = queueIndex + direction;
    if (nextIdx >= queue.length) {
      if (repeat === "all") nextIdx = 0;
      else return -1;
    }
    if (nextIdx < 0) {
      if (repeat === "all") nextIdx = queue.length - 1;
      else return -1;
    }
    return nextIdx;
  }, [queue, queueIndex, shuffle, shuffleOrder, repeat]);

  const handleNext = useCallback(() => {
    const nextIdx = getNextIndex(1);
    if (nextIdx === -1) return;
    setQueueIndex(nextIdx);
    playSong(queue[nextIdx], queue, nextIdx);
  }, [queue, getNextIndex, playSong]);

  const handlePrev = useCallback(() => {
    // If more than 3 seconds in, restart current song
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prevIdx = getNextIndex(-1);
    if (prevIdx === -1) return;
    setQueueIndex(prevIdx);
    playSong(queue[prevIdx], queue, prevIdx);
  }, [queue, getNextIndex, playSong]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
  }, []);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      if (!prev && queue.length > 0) {
        setShuffleOrder(buildShuffleOrder(queue.length, queueIndex));
      }
      return !prev;
    });
  }, [queue, queueIndex, buildShuffleOrder]);

  const toggleRepeat = useCallback(() => {
    setRepeat(prev => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const playFromQueue = useCallback((index: number) => {
    if (index >= 0 && index < queue.length) {
      setQueueIndex(index);
      playSong(queue[index], queue, index);
    }
  }, [queue, playSong]);

  return {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    queueIndex,
    shuffle,
    repeat,
    playSong,
    togglePlay,
    handleNext,
    handlePrev,
    seek,
    changeVolume,
    toggleShuffle,
    toggleRepeat,
    playFromQueue,
  };
}
