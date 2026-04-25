import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { log } from "../lib/logger";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/** Catches render errors and displays a recovery UI instead of crashing the app. */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        log.error("ErrorBoundary caught:", error, info.componentStack);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex h-full items-center justify-center p-8">
                    <div className="w-full max-w-md space-y-4 text-center">
                        <div className="text-4xl">⚠️</div>
                        <h2 className="text-lg font-bold text-text">Algo salió mal</h2>
                        <p className="text-sm text-text-muted">
                            {this.state.error?.message ?? "Error inesperado en la aplicación."}
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => this.setState({ hasError: false, error: null })}
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
