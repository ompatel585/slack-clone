import { Component } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import EmptyState from "./EmptyState";
import "../styles/workspace.css";

/**
 * Last line of defence: a render error anywhere in the app shows a recoverable screen
 * instead of a blank white page.
 */
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="error-screen" role="alert">
        <EmptyState
          tone="dark"
          icon={<TriangleAlert size={28} />}
          title="Something went wrong"
          description="An unexpected error interrupted Slap. Reloading usually fixes it — your messages are safe."
          action={
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} aria-hidden="true" />
              Reload Slap
            </button>
          }
        />
      </div>
    );
  }
}

export default ErrorBoundary;
