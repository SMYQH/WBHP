import type { PluginConfig } from "../../plugins/types";

interface PluginCardProps {
  plugin: PluginConfig;
  isActive: boolean;
  onToggle: () => void;
}

export default function PluginCard({ plugin, isActive, onToggle }: PluginCardProps) {
  return (
    <div
      className={`p-4 rounded-xl border transition-colors cursor-pointer ${
        isActive
          ? "border-blue-400 bg-blue-500/10"
          : "border-white/20 bg-white/5 hover:bg-white/10"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{plugin.name}</h3>
          <p className="text-sm opacity-60">{plugin.description}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isActive ? "border-blue-400 bg-blue-400" : "border-white/30"
          }`}
        >
          {isActive && <span className="text-white text-xs">✓</span>}
        </div>
      </div>
    </div>
  );
}
