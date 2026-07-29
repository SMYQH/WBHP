import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getItem,
  setItem,
  removeItem,
  exportAll,
  importAll,
  clearAll,
  subscribeKey,
  subscribeAll,
  invalidateAll,
  getPluginData,
  setPluginData,
  getSettings,
  setSettings,
} from "../../src/services/storage";

describe("storage service", () => {
  beforeEach(() => {
    localStorage.clear();
    invalidateAll();
  });

  it("should write and read items using localStorage and memory cache", () => {
    expect(getItem("test_key", "default_val")).toBe("default_val");

    setItem("test_key", "new_val");
    expect(getItem("test_key", "default_val")).toBe("new_val");
    expect(localStorage.getItem("wbhp:test_key")).toBe(JSON.stringify("new_val"));
  });

  it("should handle object values in getItem and setItem", () => {
    const data = { a: 1, b: "hello" };
    setItem("obj_key", data);

    const retrieved = getItem("obj_key", {});
    expect(retrieved).toEqual(data);
  });

  it("should notify subscribers when setItem or removeItem is called", () => {
    const keyListener = vi.fn();
    const globalListener = vi.fn();

    const unsubKey = subscribeKey("my_key", keyListener);
    const unsubGlobal = subscribeAll(globalListener);

    setItem("my_key", 123);
    expect(keyListener).toHaveBeenCalledTimes(1);
    expect(globalListener).toHaveBeenCalledTimes(1);

    removeItem("my_key");
    expect(keyListener).toHaveBeenCalledTimes(2);
    expect(globalListener).toHaveBeenCalledTimes(2);

    unsubKey();
    unsubGlobal();

    setItem("my_key", 456);
    expect(keyListener).toHaveBeenCalledTimes(2);
  });

  it("should support helper plugin and settings functions", () => {
    setPluginData("time", { format: "24h" });
    expect(getPluginData("time", {})).toEqual({ format: "24h" });

    setSettings({ theme: "dark" });
    expect(getSettings({})).toEqual({ theme: "dark" });
  });

  it("should correctly export and import snapshot data", () => {
    setItem("key1", "val1");
    setItem("key2", { x: 99 });

    const snapshot = exportAll();
    expect(snapshot.version).toBe(1);
    expect(snapshot.entries["key1"]).toBe("val1");
    expect(snapshot.entries["key2"]).toEqual({ x: 99 });

    clearAll();
    expect(getItem("key1", null)).toBeNull();

    importAll(snapshot);
    expect(getItem("key1", null)).toBe("val1");
    expect(getItem("key2", null)).toEqual({ x: 99 });
  });
});
