import { useMemo, type ComponentType } from "react";
import type { PluginAPI, PluginConfig, WBHPSettings } from "../plugins/types";
import { usePluginData } from "../hooks/usePluginData";

interface PluginHostProps<D = Record<string, unknown>, C = Record<string, unknown>> {
  plugin: PluginConfig<D, C>;
  settings: WBHPSettings;
  updateSettings: (patch: Partial<WBHPSettings>) => void;
  className?: string;
  as?: "div" | "section";
}

/**
 * Mounts a plugin with a real, reactive PluginAPI.
 * Keeps hooks out of parent loops and ensures data/cache are wired to storage.
 */
export default function PluginHost<D, C>({
  plugin,
  settings,
  updateSettings,
  className,
  as: Tag = "div",
}: PluginHostProps<D, C>) {
  const { data, cache } = usePluginData<D, C>(
    plugin.id,
    plugin.defaultData,
    (plugin.defaultCache ?? ({} as C)),
  );

  const api = useMemo<PluginAPI<D, C>>(
    () => ({ data, cache, settings, updateSettings }),
    [data, cache, settings, updateSettings],
  );

  const Comp = plugin.component as ComponentType<{ api: PluginAPI<D, C> }>;

  return (
    <Tag className={className}>
      <Comp api={api} />
    </Tag>
  );
}
