import { useState, useRef, useCallback, useEffect } from "react";
import { Song, addToRecentlyPlayedForUser } from "@/lib/api";
import { isSongPlayable, ytFallbackSearch } from "@/lib/youtube";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

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
  const { user } = useAuth();

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
    audio.volume = 1;
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("error", () => {
      console.error("[Player] Audio playback error");
      toast.error("Playback error — skipping to next");
    });

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

  const playSong = useCallback(async (song: Song, playlist?: Song[], index?: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playlist && index !== undefined) {
      setQueue(playlist);
      setQueueIndex(index);
      if (shuffle) {
        setShuffleOrder(buildShuffleOrder(playlist.length, index));
      }
    }

    let songToPlay = song;

    // YouTube fallback: if JioSaavn URL is missing/invalid
    if (!isSongPlayable(song) && song.source !== "local") {
      console.log(`[Player] Song "${song.name}" [${song.id}] has no playable URL`);
      console.log(`[Player] URL: "${song.url}" (type: ${typeof song.url})`);
      console.log(`[Player] Attempting YouTube fallback...`);
      
      toast.info(`Finding "${song.name}" on YouTube...`);

      try {
        const ytSong = await ytFallbackSearch(song.name, song.artist);
        if (ytSong && ytSong.url) {
          songToPlay = { ...song, url: ytSong.url, image: song.image || ytSong.image };
          console.log(`[Player] ✓ YouTube fallback success`);
          toast.success(`Playing via YouTube`);
        } else {
          console.error(`[Player] YouTube fallback returned null or no URL`);
          toast.error(`Could not find "${song.name}" on YouTube`);
          return;
        }
      } catch (err) {
        console.error(`[Player] YouTube fallback threw error:`, err);
        toast.error(`Error during fallback: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
    }

    setCurrentSong(songToPlay);
    addToRecentlyPlayedForUser(songToPlay, user?.id);
    audio.src = songToPlay.url;
    audio.play().catch((err) => {
      console.error(`[Player] Play error:`, err);
    });
  }, [shuffle, buildShuffleOrder, user]);

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
    if (audioRef.current) audioRef.current.volume = 1;
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

  const enqueue = useCallback((song: Song) => {
    if (queue.length === 0) {
      playSong(song, [song], 0);
    } else {
      // Add song right after the currently playing song (queueIndex + 1)
      setQueue(prev => {
        const newQueue = [...prev];
        newQueue.splice(queueIndex + 1, 0, song);
        return newQueue;
      });
    }
  }, [queue, queueIndex, playSong]);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);

      // Update queueIndex if the currently playing song moved
      if (fromIndex === queueIndex) {
        setQueueIndex(toIndex);
      } else if (fromIndex < queueIndex && toIndex >= queueIndex) {
        // Current song index decreased as songs moved before it
        setQueueIndex(queueIndex - 1);
      } else if (fromIndex > queueIndex && toIndex <= queueIndex) {
        // Current song index increased as songs moved before it
        setQueueIndex(queueIndex + 1);
      }

      return newQueue;
    });
  }, [queueIndex]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => {
      const newQueue = prev.filter((_, i) => i !== index);
      
      // Update queueIndex after removal
      if (index === queueIndex) {
        // Current song was removed, move to next
        if (index < newQueue.length) {
          // Play next song
          setQueueIndex(index);
        } else if (newQueue.length > 0) {
          // Play previous song if removed was last
          setQueueIndex(newQueue.length - 1);
        } else {
          // Queue is empty
          setQueueIndex(-1);
        }
      } else if (index < queueIndex) {
        // A song before current was removed, adjust index
        setQueueIndex(queueIndex - 1);
      }
      
      return newQueue;
    });
  }, [queueIndex]);

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
    enqueue,
    reorderQueue,
    removeFromQueue,
    audioRef,
  };
}
