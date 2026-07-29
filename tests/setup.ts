import "@testing-library/jest-dom";

declare global {
  var chrome: any;
}

// Mock chrome extension storage API for extension tests
if (typeof globalThis.chrome === "undefined") {
  globalThis.chrome = {
    storage: {
      local: {
        get: async () => ({}),
        set: async () => {},
        remove: async () => {},
      },
      onChanged: {
        addListener: () => {},
        removeListener: () => {},
      },
    },
  };
}
