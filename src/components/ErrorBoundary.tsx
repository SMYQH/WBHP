import { Component, type ErrorInfo, type ReactNode } from "react";
import { getTranslations } from "../i18n";

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  error: Error | null;
}

/** Catches render errors so one broken plugin cannot blank the whole new tab. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[WBHP]", this.props.fallbackLabel ?? "ErrorBoundary", error, info);
  }

  render() {
    if (this.state.error) {
      const t = getTranslations().errorBoundary;
      return (
        <div
          role="alert"
          className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <p className="font-medium">
            {this.props.fallbackLabel ?? t.title}
          </p>
          <p className="mt-1 opacity-70 break-all">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-2 rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
            onClick={() => this.setState({ error: null })}
          >
            {t.tryAgain}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

