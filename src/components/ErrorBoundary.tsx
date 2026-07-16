import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { log } from "../lib/logger";
import { createUiError } from "../lib/uiError";
import { UiErrorNotice } from "./UiErrorNotice";

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

            const error = createUiError(
                "application",
                "No se pudo mostrar esta vista.",
                this.state.error ?? undefined,
            );

            return (
                <div className="flex h-full items-center justify-center p-8">
                    <div className="w-full max-w-xl">
                        <UiErrorNotice
                            error={error}
                            onRetry={() => window.location.reload()}
                            retryLabel="Recargar la aplicación"
                        />
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
