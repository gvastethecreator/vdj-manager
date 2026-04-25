import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useApp } from "../App";

/** Main layout shell: sidebar + scrollable content area with error banner. */
export function Layout({ children }: { children: ReactNode }) {
    const { error, setError } = useApp();

    return (
        <div className="flex h-full">
            <Sidebar />
            <main className="flex-1 overflow-auto p-5">
                {error && (
                    <div className="mb-4 flex items-center justify-between rounded-[5px] border-2 border-error/30 bg-error/8 px-4 py-2.5 text-sm text-error">
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-4 rounded-[4px] px-1.5 py-0.5 font-bold opacity-70 hover:bg-error/15 hover:opacity-100"
                        >
                            ✕
                        </button>
                    </div>
                )}
                {children}
            </main>
        </div>
    );
}
