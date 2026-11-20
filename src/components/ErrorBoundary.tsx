import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches unexpected runtime errors in child routes/components and renders
 * a recoverable fallback UI instead of a blank screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught application error:", error, info);
  }

  private handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-card-soft">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-6">
              An unexpected error occurred while rendering this page. Please reload or return home.
            </p>
            <Button onClick={this.handleReload} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" /> Return to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
