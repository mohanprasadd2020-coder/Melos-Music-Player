import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AudioQualityMode = "normal" | "high";

export interface AudioEnhancementState {
  bass: number;
  mid: number;
  treble: number;
  qualityMode: AudioQualityMode;
}

const SETTINGS_KEY = "melos-audio-enhancement-settings";

const DEFAULT_SETTINGS: AudioEnhancementState = {
  bass: 0,
  mid: 0,
  treble: 0,
  qualityMode: "high",
};

const MODE_BOOSTS: Record<AudioQualityMode, Pick<AudioEnhancementState, "bass" | "mid" | "treble">> = {
  normal: { bass: 0, mid: 0, treble: 0 },
  high: { bass: 4, mid: 0, treble: 2 },
};

const clampGain = (value: number) => Math.max(-12, Math.min(12, value));

function readStoredSettings(): AudioEnhancementState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AudioEnhancementState>;
    return {
      bass: typeof parsed.bass === "number" ? parsed.bass : DEFAULT_SETTINGS.bass,
      mid: typeof parsed.mid === "number" ? parsed.mid : DEFAULT_SETTINGS.mid,
      treble: typeof parsed.treble === "number" ? parsed.treble : DEFAULT_SETTINGS.treble,
      qualityMode: parsed.qualityMode === "normal" || parsed.qualityMode === "high"
        ? parsed.qualityMode
        : DEFAULT_SETTINGS.qualityMode,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useAudioEffects(audioRef: React.RefObject<HTMLAudioElement>, volume: number) {
  const [settings, setSettings] = useState<AudioEnhancementState>(() => readStoredSettings());

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const initializedRef = useRef(false);

  const applyNodeState = useCallback((next: AudioEnhancementState, nextVolume = volume) => {
    const modeBoost = MODE_BOOSTS[next.qualityMode];
    const bassGain = clampGain(next.bass + modeBoost.bass);
    const midGain = clampGain(next.mid + modeBoost.mid);
    const trebleGain = clampGain(next.treble + modeBoost.treble);

    if (bassFilterRef.current) bassFilterRef.current.gain.setTargetAtTime(bassGain, bassFilterRef.current.context.currentTime, 0.015);
    if (midFilterRef.current) midFilterRef.current.gain.setTargetAtTime(midGain, midFilterRef.current.context.currentTime, 0.015);
    if (trebleFilterRef.current) trebleFilterRef.current.gain.setTargetAtTime(trebleGain, trebleFilterRef.current.context.currentTime, 0.015);

    if (compressorRef.current) {
      compressorRef.current.threshold.value = next.qualityMode === "high" ? -24 : -18;
      compressorRef.current.knee.value = next.qualityMode === "high" ? 24 : 20;
      compressorRef.current.ratio.value = next.qualityMode === "high" ? 4.5 : 3;
      compressorRef.current.attack.value = next.qualityMode === "high" ? 0.003 : 0.01;
      compressorRef.current.release.value = next.qualityMode === "high" ? 0.25 : 0.35;
    }

    if (masterGainRef.current) {
      const safeVolume = Number.isFinite(nextVolume) ? Math.max(0, Math.min(1, nextVolume)) : 1;
      masterGainRef.current.gain.setTargetAtTime(safeVolume, masterGainRef.current.context.currentTime, 0.015);
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;

    const ensureContext = async () => {
      if (cancelled) return;
      if (audioContextRef.current && initializedRef.current) {
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
        return;
      }

      try {
        const context = new AudioContext({ latencyHint: "playback" });
        const source = context.createMediaElementSource(audio);
        const bassFilter = context.createBiquadFilter();
        const midFilter = context.createBiquadFilter();
        const trebleFilter = context.createBiquadFilter();
        const compressor = context.createDynamicsCompressor();
        const masterGain = context.createGain();

        bassFilter.type = "lowshelf";
        bassFilter.frequency.value = 200;
        bassFilter.Q.value = 0.7;

        midFilter.type = "peaking";
        midFilter.frequency.value = 1000;
        midFilter.Q.value = 1.0;

        trebleFilter.type = "highshelf";
        trebleFilter.frequency.value = 6000;
        trebleFilter.Q.value = 0.7;

        compressor.threshold.value = -24;
        compressor.knee.value = 24;
        compressor.ratio.value = 4.5;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        source.connect(bassFilter);
        bassFilter.connect(midFilter);
        midFilter.connect(trebleFilter);
        trebleFilter.connect(compressor);
        compressor.connect(masterGain);
        masterGain.connect(context.destination);

        audio.volume = 1;
        audio.muted = false;

        audioContextRef.current = context;
        sourceRef.current = source;
        bassFilterRef.current = bassFilter;
        midFilterRef.current = midFilter;
        trebleFilterRef.current = trebleFilter;
        compressorRef.current = compressor;
        masterGainRef.current = masterGain;
        initializedRef.current = true;

        if (context.state === "suspended") {
          await context.resume();
        }

        applyNodeState(settings, volume);
      } catch (error) {
        console.error("Web Audio API initialization failed:", error);
      }
    };

    const unlockAudio = () => {
      void ensureContext();
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };

    const resumeOnPlay = () => {
      if (audioContextRef.current?.state === "suspended") {
        void audioContextRef.current.resume();
      }
    };

    const forceMaxElementVolume = () => {
      audio.volume = 1;
      audio.muted = false;
    };

    audio.addEventListener("play", resumeOnPlay);
    audio.addEventListener("playing", resumeOnPlay);
    audio.addEventListener("volumechange", forceMaxElementVolume);

    document.addEventListener("click", unlockAudio, { once: true });
    document.addEventListener("touchstart", unlockAudio, { once: true });
    document.addEventListener("keydown", unlockAudio, { once: true });

    forceMaxElementVolume();
    void ensureContext();

    return () => {
      cancelled = true;
      audio.removeEventListener("play", resumeOnPlay);
      audio.removeEventListener("playing", resumeOnPlay);
      audio.removeEventListener("volumechange", forceMaxElementVolume);
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };
  }, [audioRef, applyNodeState, settings, volume]);

  useEffect(() => {
    applyNodeState(settings, volume);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [applyNodeState, settings, volume]);

  const setBass = useCallback((bass: number) => {
    setSettings((prev) => ({ ...prev, bass }));
  }, []);

  const setMid = useCallback((mid: number) => {
    setSettings((prev) => ({ ...prev, mid }));
  }, []);

  const setTreble = useCallback((treble: number) => {
    setSettings((prev) => ({ ...prev, treble }));
  }, []);

  const setQualityMode = useCallback((qualityMode: AudioQualityMode) => {
    setSettings((prev) => ({ ...prev, qualityMode }));
  }, []);

  const resetEQ = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      bass: 0,
      mid: 0,
      treble: 0,
      qualityMode: "high",
    }));
  }, []);

  return {
    bass: settings.bass,
    mid: settings.mid,
    treble: settings.treble,
    qualityMode: settings.qualityMode,
    setBass,
    setMid,
    setTreble,
    setQualityMode,
    resetEQ,
  };
}
