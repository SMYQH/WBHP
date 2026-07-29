import "@testing-library/jest-dom/vitest";

// Mock chrome extension storage API for extension tests
if (typeof globalThis.chrome === "undefined") {
  (globalThis as any).chrome = {
    storage: {
      local: {
        get: async () => ({}),
        set: async () => {},
        remove: async () => {},
        clear: async () => {},
      },
      sync: {
        get: async () => ({}),
        set: async () => {},
        remove: async () => {},
        clear: async () => {},
      },
      onChanged: {
        addListener: () => {},
        removeListener: () => {},
      },
    },
  };
}
