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
    expect(widgets.length).toBeGreaterThanOrEqual(10);
    const ids = widgets.map((w) => w.id);
    expect(ids).toContain("time");
    expect(ids).toContain("greeting");
    expect(ids).toContain("search");
    expect(ids).toContain("links");
  });

  it("registers backgrounds correctly", () => {
    const colorBg = getPlugin("color");
    expect(colorBg).toBeDefined();
    expect(colorBg?.type).toBe("background");

    const backgrounds = getBackgroundPlugins();
    expect(backgrounds.length).toBeGreaterThanOrEqual(5);
    const ids = backgrounds.map((b) => b.id);
    expect(ids).toContain("color");
    expect(ids).toContain("gradient");
    expect(ids).toContain("bing");
  });

  it("retrieves all plugins via getAllPlugins", () => {
    const all = getAllPlugins();
    expect(all.length).toBeGreaterThanOrEqual(15);
  });
});
