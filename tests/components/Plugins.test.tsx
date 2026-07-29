import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PluginHost from "../../src/components/PluginHost";
import { DEFAULT_SETTINGS } from "../../src/hooks/useSettings";
import { getPlugin } from "../../src/plugins/registry";
import { clearAll } from "../../src/services/storage";
import "../../src/plugins/widgets";
import "../../src/plugins/backgrounds";

describe("PluginHost and Component integration", () => {
  beforeEach(() => {
    clearAll();
  });

  it("renders TimeWidget successfully through PluginHost", () => {
    const plugin = getPlugin("time");
    expect(plugin).toBeDefined();

    const { container } = render(
      <PluginHost
        plugin={plugin!}
        settings={DEFAULT_SETTINGS}
        updateSettings={() => {}}
      />
    );

    expect(container.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it("renders GreetingWidget and responds to name settings", () => {
    const plugin = getPlugin("greeting");
    expect(plugin).toBeDefined();

    render(
      <PluginHost
        plugin={plugin!}
        settings={{ ...DEFAULT_SETTINGS, userName: "Developer" }}
        updateSettings={() => {}}
      />
    );

    expect(screen.getByText(/Developer/i)).toBeInTheDocument();
  });

  it("renders SearchWidget and inputs query", () => {
    const plugin = getPlugin("search");
    expect(plugin).toBeDefined();

    render(
      <PluginHost
        plugin={plugin!}
        settings={DEFAULT_SETTINGS}
        updateSettings={() => {}}
      />
    );

    const input = screen.getByRole("searchbox");
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "Vitest Testing" } });
    expect(input).toHaveValue("Vitest Testing");
  });

  it("renders LinksWidget and handles links", () => {
    const plugin = getPlugin("links");
    expect(plugin).toBeDefined();

    const { container } = render(
      <PluginHost
        plugin={plugin!}
        settings={DEFAULT_SETTINGS}
        updateSettings={() => {}}
      />
    );

    expect(container).toBeInTheDocument();
  });
});
