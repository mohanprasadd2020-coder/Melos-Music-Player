import { Gauge, Sparkles, Sliders, Volume2 } from "lucide-react";
import { AudioQualityMode } from "@/hooks/useAudioEffects";
import { Slider } from "./ui/slider";

interface EqualizerProps {
  bass: number;
  mid: number;
  treble: number;
  qualityMode: AudioQualityMode;
  setBass: (gain: number) => void;
  setMid: (gain: number) => void;
  setTreble: (gain: number) => void;
  setQualityMode: (mode: AudioQualityMode) => void;
  resetEQ: () => void;
}

const MODE_LABELS: Record<AudioQualityMode, { title: string; description: string }> = {
  normal: {
    title: "Normal Mode",
    description: "Lighter processing for quick playback and a clean, balanced sound.",
  },
  high: {
    title: "High Quality Mode",
    description: "Richer bass, clearer vocals, and stronger speaker-friendly loudness control.",
  },
};

function formatDb(value: number) {
  return value >= 0 ? `+${value.toFixed(1)}dB` : `${value.toFixed(1)}dB`;
}

export default function Equalizer({
  bass,
  mid,
  treble,
  qualityMode,
  setBass,
  setMid,
  setTreble,
  setQualityMode,
  resetEQ,
}: EqualizerProps) {
  return (
    <div className="fixed bottom-[80px] right-4 z-40 bg-card border border-border rounded-lg shadow-lg p-4 w-[340px] max-h-[78vh] overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <Sliders size={18} className="text-primary" />
        <h3 className="font-semibold text-foreground">Audio Quality</h3>
        <button
          onClick={resetEQ}
          className="ml-auto text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 text-foreground rounded transition-colors"
        >
          Reset All
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Source selection and loudness normalization are always enabled. Tune the sound below for your speakers or car system.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setQualityMode("normal")}
          className={`flex items-center gap-2 justify-center p-2 rounded border transition-colors ${
            qualityMode === "normal"
              ? "bg-primary/20 border-primary text-primary"
              : "bg-card border-border hover:bg-secondary text-muted-foreground"
          }`}
        >
          <Gauge size={18} />
          <span className="text-xs font-semibold">Normal</span>
        </button>
        <button
          onClick={() => setQualityMode("high")}
          className={`flex items-center gap-2 justify-center p-2 rounded border transition-colors ${
            qualityMode === "high"
              ? "bg-primary/20 border-primary text-primary"
              : "bg-card border-border hover:bg-secondary text-muted-foreground"
          }`}
        >
          <Sparkles size={18} />
          <span className="text-xs font-semibold">High Quality</span>
        </button>
      </div>

      <div className="rounded-lg border border-border bg-secondary/20 p-3 mb-4">
        <p className="text-sm font-semibold text-foreground">{MODE_LABELS[qualityMode].title}</p>
        <p className="text-xs text-muted-foreground mt-1">{MODE_LABELS[qualityMode].description}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Bass (200Hz)</label>
            <span className="text-xs font-mono font-semibold text-primary bg-secondary/50 px-2 py-1 rounded">
              {formatDb(bass)}
            </span>
          </div>
          <Slider
            value={[bass]}
            min={-6}
            max={8}
            step={0.5}
            onValueChange={([value]) => setBass(value)}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Mid (1kHz)</label>
            <span className="text-xs font-mono font-semibold text-primary bg-secondary/50 px-2 py-1 rounded">
              {formatDb(mid)}
            </span>
          </div>
          <Slider
            value={[mid]}
            min={-6}
            max={6}
            step={0.5}
            onValueChange={([value]) => setMid(value)}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Treble (6kHz)</label>
            <span className="text-xs font-mono font-semibold text-primary bg-secondary/50 px-2 py-1 rounded">
              {formatDb(treble)}
            </span>
          </div>
          <Slider
            value={[treble]}
            min={-6}
            max={8}
            step={0.5}
            onValueChange={([value]) => setTreble(value)}
            className="cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-secondary/30 p-3 flex items-start gap-2">
        <Volume2 size={16} className="text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          A compressor keeps songs closer in loudness so vocals and bass stay punchy without unpleasant clipping.
        </p>
      </div>
    </div>
  );
}