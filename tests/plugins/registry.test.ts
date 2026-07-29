import { describe, it, expect } from "vitest";
import {
  getPlugin,
  getAllPlugins,
  getWidgetPlugins,
  getBackgroundPlugins,
} from "../../src/plugins/registry";
import "../../src/plugins/widgets";
import "../../src/plugins/backgrounds";

describe("plugin registry", () => {
  it("registers widgets correctly", () => {
    const timePlugin = getPlugin("time");
    expect(timePlugin).toBeDefined();
    expect(timePlugin?.name).toBe("Time");
    expect(timePlugin?.type).toBe("widget");

    const widgets = getWidgetPlugins();
    expect(widgets.length).toBeGreaterThanOrEqual(9);
    const ids = widgets.map((w) => w.id);
    expect(ids).toContain("time");
    expect(ids).toContain("greeting");
    expect(ids).toContain("search");
    expect(ids).toContain("links");
  });

  it("registers backgrounds correctly", () => {
    const presetBg = getPlugin("preset");
    expect(presetBg).toBeDefined();
    expect(presetBg?.type).toBe("background");

    const backgrounds = getBackgroundPlugins();
    expect(backgrounds.length).toBeGreaterThanOrEqual(3);
    const ids = backgrounds.map((b) => b.id);
    expect(ids).toContain("preset");
    expect(ids).toContain("bing");
    expect(ids).toContain("custom");
  });

  it("retrieves all plugins via getAllPlugins", () => {
    const all = getAllPlugins();
    expect(all.length).toBeGreaterThanOrEqual(12);
  });
});
