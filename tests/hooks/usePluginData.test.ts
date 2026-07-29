import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePluginData } from "../../src/hooks/usePluginData";
import { clearAll } from "../../src/services/storage";

describe("usePluginData hook", () => {
  beforeEach(() => {
    clearAll();
  });

  it("manages plugin data reactively", () => {
    const defaultData = { count: 0, text: "hello" };
    const { result } = renderHook(() =>
      usePluginData("my_widget", defaultData)
    );

    expect(result.current.data.get()).toEqual(defaultData);

    act(() => {
      result.current.data.set((prev) => ({ ...prev, count: 5 }));
    });

    expect(result.current.data.get()).toEqual({ count: 5, text: "hello" });
  });

  it("manages ephemeral plugin cache reactively", () => {
    const defaultCache = { loading: false };
    const { result } = renderHook(() =>
      usePluginData("my_widget", {}, defaultCache)
    );

    expect(result.current.cache.get()).toEqual(defaultCache);

    act(() => {
      result.current.cache.set({ loading: true });
    });

    expect(result.current.cache.get()).toEqual({ loading: true });
  });
});
