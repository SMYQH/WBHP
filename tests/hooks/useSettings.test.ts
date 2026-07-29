import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "../../src/hooks/useSettings";
import { clearAll } from "../../src/services/storage";

describe("useSettings hook", () => {
  beforeEach(() => {
    clearAll();
  });

  it("returns default settings initially", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.theme).toBe("system");
    expect(result.current.settings.activeBackground).toBe("gradient");
  });

  it("updates settings reactively when updateSettings is called", () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ theme: "dark", userName: "Alice" });
    });

    expect(result.current.settings.theme).toBe("dark");
    expect(result.current.settings.userName).toBe("Alice");
  });
});
