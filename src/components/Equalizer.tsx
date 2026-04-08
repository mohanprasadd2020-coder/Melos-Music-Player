import { Sliders, ChevronDown, Speaker, Disc3 } from "lucide-react";
import { useState } from "react";
import { EQPreset, EQBand } from "@/hooks/useAudioEffects";
import { Slider } from "./ui/slider";

interface EqualizerProps {
  preset: EQPreset;
  bands: EQBand[];
  applyPreset: (presetName: EQPreset) => void;
  updateBand: (bandIndex: number, gain: number) => void;
  resetEQ: () => void;
  is3DEnabled: boolean;
  isBassBoostEnabled: boolean;
  toggle3D: () => void;
  toggleBassBoost: () => void;
}

const PRESETS: { name: EQPreset; label: string }[] = [
  { name: "off", label: "Off" },
  { name: "normal", label: "Normal" },
  { name: "pop", label: "Pop" },
  { name: "rock", label: "Rock" },
  { name: "classical", label: "Classical" },
  { name: "bass", label: "Bass Boost" },
  { name: "treble", label: "Treble Boost" },
  { name: "jazz", label: "Jazz" },
  { name: "electronic", label: "Electronic" },
];

const BAND_LABELS = ["Bass (60Hz)", "Low (250Hz)", "Mid (1kHz)", "High (4kHz)", "Treble (16kHz)"];

export default function Equalizer({ 
  preset, 
  bands, 
  applyPreset, 
  updateBand, 
  resetEQ,
  is3DEnabled,
  isBassBoostEnabled,
  toggle3D,
  toggleBassBoost
}: EqualizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentPresetLabel = PRESETS.find(p => p.name === preset)?.label || "Custom";

  return (
    <div className="fixed bottom-[80px] right-4 z-40 bg-card border border-border rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sliders size={18} className="text-primary" />
        <h3 className="font-semibold text-foreground">Audio Effects</h3>
        <button
          onClick={resetEQ}
          className="ml-auto text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 text-foreground rounded transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Special Effects Section */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={toggle3D}
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded border transition-colors ${
            is3DEnabled ? "bg-primary/20 border-primary text-primary" : "bg-card border-border hover:bg-secondary text-muted-foreground"
          }`}
        >
          <Disc3 size={20} className="mb-1" />
          <span className="text-xs font-semibold">3D Audio</span>
        </button>
        <button
          onClick={toggleBassBoost}
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded border transition-colors ${
            isBassBoostEnabled ? "bg-primary/20 border-primary text-primary" : "bg-card border-border hover:bg-secondary text-muted-foreground"
          }`}
        >
          <Speaker size={20} className="mb-1" />
          <span className="text-xs font-semibold">Mega Bass</span>
        </button>
      </div>

      {/* Preset Selector */}
      <div className="mb-4">
        <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase">EQ Preset</label>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors text-sm"
          >
            <span>{currentPresetLabel}</span>
            <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    applyPreset(p.name);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${
                    preset === p.name ? "bg-primary/20 text-primary font-medium" : "text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Controls Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between px-3 py-2 bg-secondary/50 hover:bg-secondary text-foreground rounded-md text-sm mb-3 transition-colors"
      >
        <span className="text-xs font-medium">Advanced Controls</span>
        <ChevronDown size={14} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
      </button>

      {/* Band Sliders */}
      {showAdvanced && (
        <div className="space-y-4">
          {bands.map((band, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">{BAND_LABELS[idx]}</label>
                <span className="text-xs font-mono font-semibold text-primary bg-secondary/50 px-2 py-1 rounded">
                  {band.gain > 0 ? "+" : ""}{band.gain.toFixed(1)}dB
                </span>
              </div>
              <Slider
                value={[band.gain]}
                min={-12}
                max={12}
                step={0.5}
                onValueChange={([value]) => updateBand(idx, value)}
                className="cursor-pointer"
              />
            </div>
          ))}
        </div>
      )}

      {/* Quick Preview */}
      {!showAdvanced && (
        <div className="text-xs text-muted-foreground bg-secondary/40 rounded p-2 text-center">
          Click "Advanced Controls" to manually adjust frequency bands
        </div>
      )}
    </div>
  );
}
