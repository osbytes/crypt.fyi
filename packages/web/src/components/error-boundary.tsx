import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-4">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="w-content"
              >
                Try again
              </Button>
              <Link
                to="/"
                className="text-muted-foreground text-sm"
                onClick={() => this.setState({ hasError: false })}
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
