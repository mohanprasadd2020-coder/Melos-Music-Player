import { useState, useRef, useEffect, useCallback } from "react";

export type EQPreset = "off" | "normal" | "pop" | "rock" | "classical" | "bass" | "treble" | "jazz" | "electronic";

interface EQBand {
  freq: number;
  gain: number;
  Q: number;
}

const EQ_PRESETS: Record<EQPreset, EQBand[]> = {
  off: [
    { freq: 60, gain: 0, Q: 0.4 },
    { freq: 250, gain: 0, Q: 0.4 },
    { freq: 1000, gain: 0, Q: 0.4 },
    { freq: 4000, gain: 0, Q: 0.4 },
    { freq: 16000, gain: 0, Q: 0.4 },
  ],
  normal: [
    { freq: 60, gain: 0, Q: 0.4 },
    { freq: 250, gain: 0, Q: 0.4 },
    { freq: 1000, gain: 0, Q: 0.4 },
    { freq: 4000, gain: 0, Q: 0.4 },
    { freq: 16000, gain: 0, Q: 0.4 },
  ],
  pop: [
    { freq: 60, gain: 2, Q: 0.4 },
    { freq: 250, gain: 1, Q: 0.4 },
    { freq: 1000, gain: -2, Q: 0.4 },
    { freq: 4000, gain: 2, Q: 0.4 },
    { freq: 16000, gain: 3, Q: 0.4 },
  ],
  rock: [
    { freq: 60, gain: 4, Q: 0.4 },
    { freq: 250, gain: 0.5, Q: 0.4 },
    { freq: 1000, gain: -3, Q: 0.4 },
    { freq: 4000, gain: 2, Q: 0.4 },
    { freq: 16000, gain: 3.5, Q: 0.4 },
  ],
  classical: [
    { freq: 60, gain: -2, Q: 0.4 },
    { freq: 250, gain: 2, Q: 0.4 },
    { freq: 1000, gain: 0, Q: 0.4 },
    { freq: 4000, gain: 1, Q: 0.4 },
    { freq: 16000, gain: 2, Q: 0.4 },
  ],
  bass: [
    { freq: 60, gain: 8, Q: 0.4 },
    { freq: 250, gain: 5, Q: 0.4 },
    { freq: 1000, gain: 0, Q: 0.4 },
    { freq: 4000, gain: -2, Q: 0.4 },
    { freq: 16000, gain: 0, Q: 0.4 },
  ],
  treble: [
    { freq: 60, gain: -3, Q: 0.4 },
    { freq: 250, gain: -2, Q: 0.4 },
    { freq: 1000, gain: 0, Q: 0.4 },
    { freq: 4000, gain: 3, Q: 0.4 },
    { freq: 16000, gain: 6, Q: 0.4 },
  ],
  jazz: [
    { freq: 60, gain: 1, Q: 0.4 },
    { freq: 250, gain: 2, Q: 0.4 },
    { freq: 1000, gain: -1, Q: 0.4 },
    { freq: 4000, gain: 0.5, Q: 0.4 },
    { freq: 16000, gain: 2, Q: 0.4 },
  ],
  electronic: [
    { freq: 60, gain: 3, Q: 0.4 },
    { freq: 250, gain: -1, Q: 0.4 },
    { freq: 1000, gain: -3, Q: 0.4 },
    { freq: 4000, gain: 4, Q: 0.4 },
    { freq: 16000, gain: 5, Q: 0.4 },
  ],
};

export function useAudioEffects(audioRef: React.RefObject<HTMLAudioElement>) {
  const [preset, setPreset] = useState<EQPreset>("off");
  const [bands, setBands] = useState<EQBand[]>(EQ_PRESETS.off);
  const audioContextRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioRef.current) return;

    let mounted = true;

    const initAudio = () => {
      if (!mounted || audioContextRef.current) return; // Already initialized

      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        
        if (!AudioContextClass) {
          console.error("Web Audio API not supported");
          return;
        }

        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        // Create source from audio element
        const source = audioContext.createMediaElementSource(audioRef.current!);
        sourceRef.current = source;

        // Create gain node for final output
        const gainNode = audioContext.createGain();
        gainNodeRef.current = gainNode;

        // Create equalizer filters
        const newFilters: BiquadFilterNode[] = [];
        let lastNode: AudioNode = source;

        bands.forEach((band, idx) => {
          const filter = audioContext.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.value = band.freq;
          filter.gain.value = band.gain;
          filter.Q.value = band.Q;

          newFilters.push(filter);
          lastNode.connect(filter);
          lastNode = filter;
        });

        filtersRef.current = newFilters;

        // Connect to gain and destination
        lastNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
      } catch (err) {
        console.error("Web Audio API initialization failed:", err);
      }
    };

    // Initialize on first user interaction (required by browsers)
    const startAudio = () => {
      initAudio();
      document.removeEventListener("click", startAudio);
      document.removeEventListener("touchstart", startAudio);
    };

    document.addEventListener("click", startAudio, { once: true });
    document.addEventListener("touchstart", startAudio, { once: true });

    return () => {
      mounted = false;
      document.removeEventListener("click", startAudio);
      document.removeEventListener("touchstart", startAudio);
    };
  }, [audioRef, bands]);

  const applyPreset = useCallback((presetName: EQPreset) => {
    const presetBands = EQ_PRESETS[presetName];
    setBands(presetBands);
    setPreset(presetName);

    // Apply to filters if audio context is ready
    if (filtersRef.current.length > 0) {
      filtersRef.current.forEach((filter, idx) => {
        filter.gain.value = presetBands[idx].gain;
      });
    }
  }, []);

  const updateBand = useCallback((bandIndex: number, gain: number) => {
    const newBands = [...bands];
    newBands[bandIndex].gain = gain;
    setBands(newBands);
    setPreset("off"); // Custom preset when manually adjusting

    // Update filter immediately
    if (filtersRef.current[bandIndex]) {
      filtersRef.current[bandIndex].gain.value = gain;
    }
  }, [bands]);

  const resetEQ = useCallback(() => {
    applyPreset("off");
  }, [applyPreset]);

  return {
    preset,
    bands,
    applyPreset,
    updateBand,
    resetEQ,
  };
}
