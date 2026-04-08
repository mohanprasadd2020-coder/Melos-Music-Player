import { useState, useRef, useEffect, useCallback } from "react";

export type EQPreset = "off" | "normal" | "pop" | "rock" | "classical" | "bass" | "treble" | "jazz" | "electronic" | "custom";

export interface EQBand {
  freq: number;
  gain: number;
  Q: number;
}

const EQ_PRESETS: Omit<Record<EQPreset, EQBand[]>, "custom"> = {
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

interface AudioGraph {
  audioContext: AudioContext;
  filters: BiquadFilterNode[];
  source: MediaElementAudioSourceNode;
  gainNode: GainNode;
  panner: PannerNode | null;
  bassFilter: BiquadFilterNode;
}

const audioGraphCache = new WeakMap<HTMLMediaElement, AudioGraph>();

export function useAudioEffects(audioRef: React.RefObject<HTMLAudioElement>) {
  const [preset, setPreset] = useState<EQPreset>("off");
  const [bands, setBands] = useState<EQBand[]>(EQ_PRESETS.off);
  const [is3DEnabled, setIs3DEnabled] = useState(false);
  const [isBassBoostEnabled, setIsBassBoostEnabled] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Extra effects refs
  const pannerRef = useRef<PannerNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const is3DEnabledRef = useRef(is3DEnabled);
  const isBassBoostEnabledRef = useRef(isBassBoostEnabled);

  // Sync refs with state
  useEffect(() => {
    is3DEnabledRef.current = is3DEnabled;
  }, [is3DEnabled]);
  
  useEffect(() => {
    isBassBoostEnabledRef.current = isBassBoostEnabled;
    if (bassFilterRef.current) {
        // Apply bass boost frequency and gain dynamically
        bassFilterRef.current.gain.value = isBassBoostEnabled ? 8 : 0;
    }
  }, [isBassBoostEnabled]);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioRef.current) return;

    let mounted = true;
    let animationFrameId: number;

    const initAudio = () => {
      if (!mounted || audioContextRef.current) return; // Already initialized

      try {
        const audioElement = audioRef.current!;

        if (audioGraphCache.has(audioElement)) {
          console.log("Using cached audio graph");
          const cachedGraph = audioGraphCache.get(audioElement)!;
          audioContextRef.current = cachedGraph.audioContext;
          filtersRef.current = cachedGraph.filters;
          sourceRef.current = cachedGraph.source;
          gainNodeRef.current = cachedGraph.gainNode;
          pannerRef.current = cachedGraph.panner;
          bassFilterRef.current = cachedGraph.bassFilter;
          
          if (cachedGraph.audioContext.state === "suspended") {
            cachedGraph.audioContext.resume();
          }
          
          start3DAnimation();
          return;
        }
        sourceRef.current = source;

        // Create gain node for final output
        const gainNode = audioContext.createGain();
        gainNodeRef.current = gainNode;

        // Extra Effects: Bass Boost Filter
        const bassFilter = audioContext.createBiquadFilter();
        bassFilter.type = "lowshelf";
        bassFilter.frequency.value = 80;
        bassFilter.gain.value = isBassBoostEnabledRef.current ? 8 : 0;
        bassFilterRef.current = bassFilter;

        // Extra Effects: 3D Panner (Spatial Audio)
        const panner = audioContext.createPanner ? audioContext.createPanner() : null;
        if (panner) {
          panner.panningModel = "HRTF";
          panner.distanceModel = "inverse";
          panner.refDistance = 1;
          panner.maxDistance = 10000;
          panner.rolloffFactor = 1;
          
          // Set the listener to the origin
          const listener = audioContext.listener;
          if (listener.positionX) {
            listener.positionX.value = 0;
            listener.positionY.value = 0;
            listener.positionZ.value = 0;
            listener.forwardX.value = 0;
            listener.forwardY.value = 0;
            listener.forwardZ.value = -1;
            listener.upX.value = 0;
            listener.upY.value = 1;
            listener.upZ.value = 0;
          } else {
            // Fallback for older browsers
            listener.setPosition(0, 0, 0);
            listener.setOrientation(0, 0, -1, 0, 1, 0);
          }
          
          pannerRef.current = panner;
        }

        // Create equalizer filters
        const newFilters: BiquadFilterNode[] = [];
        let lastNode: AudioNode = source;

        // Connect source -> bass boost -> panner -> EQ
        lastNode.connect(bassFilter);
        lastNode = bassFilter;

        if (panner) {
          lastNode.connect(panner);
          lastNode = panner;
        }

        EQ_PRESETS.off.forEach((band, idx) => {
          const filter = audioContext.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.value = band.freq;
          filter.gain.value = band.gain; // Currently 0 since default is off
          filter.Q.value = band.Q;

          newFilters.push(filter);
          lastNode.connect(filter);
          lastNode = filter;
        });

        filtersRef.current = newFilters;

        // Connect to gain and destination
        lastNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Run true spatial 3D effect loop
        let pannerTime = 0;
        const animate3D = () => {
           if (!mounted) return;
           if (pannerRef.current) {
             if (is3DEnabledRef.current) {
               // Greatly increase radius and speed to make the 3D effect immediately obvious
               const radius = 5; 
               const x = Math.sin(pannerTime) * radius;
               // Orbit mostly goes around your head on the Z axis
               const z = -Math.cos(pannerTime) * radius; 
               
               // Noticeable vertical bounce
               const y = Math.sin(pannerTime * 1.5) * 2;
               
               if (pannerRef.current.positionX) {
                 pannerRef.current.positionX.value = x;
                 pannerRef.current.positionY.value = y;
                 pannerRef.current.positionZ.value = z;
               } else {
                 // Fallback for older browsers
                 pannerRef.current.setPosition(x, y, z);
               }
               
               pannerTime += 0.025; // Faster rotation to feel it quickly
             } else {
               // Reset directly to front center
               if (pannerRef.current.positionX) {
                 pannerRef.current.positionX.value = 0;
                 pannerRef.current.positionY.value = 0;
                 pannerRef.current.positionZ.value = -1; // Directly in front
               } else {
                 pannerRef.current.setPosition(0, 0, -1);
               }
             }
           }
           animationFrameId = requestAnimationFrame(animate3D);
        };
        animate3D();
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
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      document.removeEventListener("click", startAudio);
      document.removeEventListener("touchstart", startAudio);
    };
  }, [audioRef]); // Removed bands from dependencies to avoid continuous re-render errors!

  const applyPreset = useCallback((presetName: EQPreset) => {
    if (presetName === "custom") return;
    const presetBands = EQ_PRESETS[presetName as keyof typeof EQ_PRESETS];
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
    setBands(prev => {
        const newBands = [...prev];
        newBands[bandIndex] = { ...newBands[bandIndex], gain };
        return newBands;
    });
    setPreset("custom"); // Set "custom" correctly

    // Update filter immediately
    if (filtersRef.current[bandIndex]) {
      filtersRef.current[bandIndex].gain.value = gain;
    }
  }, []);

  const toggle3D = useCallback(() => setIs3DEnabled(prev => !prev), []);
  const toggleBassBoost = useCallback(() => setIsBassBoostEnabled(prev => !prev), []);

  const resetEQ = useCallback(() => {
    applyPreset("off");
    setIs3DEnabled(false);
    setIsBassBoostEnabled(false);
  }, [applyPreset]);

  return {
    preset,
    bands,
    is3DEnabled,
    isBassBoostEnabled,
    applyPreset,
    updateBand,
    toggle3D,
    toggleBassBoost,
    resetEQ,
  };
}
