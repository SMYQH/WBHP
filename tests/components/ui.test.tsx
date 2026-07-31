import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { cn } from "../../src/lib/utils";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../src/components/ui/dropdown-menu";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../src/components/ui/tooltip";

describe("shadcn/ui Utilities & Components", () => {
  it("cn utility merges class names correctly", () => {
    expect(cn("px-2 py-1", "bg-red-500", { "text-white": true })).toBe(
      "px-2 py-1 bg-red-500 text-white"
    );
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("renders Button component with default and cyan-glow variants", () => {
    const { rerender } = render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("bg-cyan-500");

    rerender(<Button variant="cyan-glow">Glowing Button</Button>);
    const glowBtn = screen.getByRole("button", { name: /glowing button/i });
    expect(glowBtn.className).toContain("border-cyan-500/40");
  });

  it("renders Input component with custom attributes", () => {
    render(<Input placeholder="Search here..." defaultValue="test value" />);
    const input = screen.getByPlaceholderText("Search here...");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("test value");
  });

  it("renders Dialog structure without crashing", () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Dialog body text</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog body text")).toBeInTheDocument();
  });

  it("renders DropdownMenu content when open", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders Tooltip component within TooltipProvider", () => {
    render(
      <TooltipProvider>
        <Tooltip open={true}>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip details</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    expect(screen.getByText("Hover me")).toBeInTheDocument();
    expect(screen.getByText("Tooltip details")).toBeInTheDocument();
  });
});
