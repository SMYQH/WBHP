import type { PluginConfig } from "./types";

/** Global plugin registry. Plugins self-register via side-effect imports. */
const registry = new Map<string, PluginConfig<any, any>>();

export function registerPlugin(config: PluginConfig<any, any>): void {
  if (registry.has(config.id)) {
    console.warn(`Plugin "${config.id}" is already registered — overwriting.`);
  }
  registry.set(config.id, config);
}

export function getPlugin(id: string): PluginConfig | undefined {
  return registry.get(id);
}

export function getAllPlugins(): PluginConfig[] {
  return Array.from(registry.values());
}

export function getWidgetPlugins(): PluginConfig[] {
  return getAllPlugins().filter((p) => p.type === "widget");
}

export function getBackgroundPlugins(): PluginConfig[] {
  return getAllPlugins().filter((p) => p.type === "background");
}
