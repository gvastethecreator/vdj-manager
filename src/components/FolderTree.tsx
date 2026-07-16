import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { compareDriveAwarePaths, getPathLeafName } from "../lib/pathUtils";
import { buildDrivePathTree } from "../lib/pathTree";
import { useApp } from "../App";

interface TreeNode {
    path: string;
    name: string;
    expanded: boolean;
    children: TreeNode[] | null; // null = not loaded yet
}

interface FolderTreeProps {
    roots: string[];
    onSelect: (path: string) => void;
    selectedPath: string;
    /** Max height for the scroll container (default 48 = 12rem) */
    maxHeightClass?: string;
}

/** Recursive folder tree that lazy-loads subdirectories on expand. */
export function FolderTree({
    roots,
    onSelect,
    selectedPath,
    maxHeightClass = "max-h-48",
}: FolderTreeProps) {
    const { services } = useApp();
    const [nodes, setNodes] = useState<TreeNode[]>([]);

    /* Initialise root nodes and auto-expand them so the user
       immediately sees top-level subdirectories. */
    useEffect(() => {
        let cancelled = false;

        function addChildrenToNode(items: TreeNode[], path: string, children: TreeNode[]): TreeNode[] {
            return items.map((node) => {
                if (node.path.toLowerCase() === path.toLowerCase()) {
                    const existing = new Set((node.children ?? []).map((child) => child.path.toLowerCase()));
                    const mergedChildren = [
                        ...(node.children ?? []),
                        ...children.filter((child) => !existing.has(child.path.toLowerCase())),
                    ].sort((a, b) => compareDriveAwarePaths(a.path, b.path));

                    return { ...node, expanded: true, children: mergedChildren };
                }

                return {
                    ...node,
                    children: node.children ? addChildrenToNode(node.children, path, children) : node.children,
                };
            });
        }

        async function initRoots() {
            let result: TreeNode[] = buildDrivePathTree(roots);
            for (const r of roots) {
                try {
                    const subdirs = await services.listSubdirectories(r);
                    const children = subdirs
                        .sort(compareDriveAwarePaths)
                        .map((s) => ({
                            path: s,
                            name: getPathLeafName(s),
                            expanded: false,
                            children: null,
                        }));
                    result = addChildrenToNode(result, r, children);
                } catch {
                    result = addChildrenToNode(result, r, []);
                }
            }
            if (!cancelled) setNodes(result);
        }
        if (roots.length > 0) {
            initRoots();
        } else {
            setNodes([]);
        }
        return () => { cancelled = true; };
    }, [roots, services]);

    async function toggleNode(path: string) {
        async function updateNodes(items: TreeNode[]): Promise<TreeNode[]> {
            const result: TreeNode[] = [];
            for (const node of items) {
                if (node.path === path) {
                    if (!node.expanded && node.children === null) {
                        try {
                            const subdirs = await services.listSubdirectories(node.path);
                            const children: TreeNode[] = subdirs.sort(compareDriveAwarePaths).map((s) => ({
                                path: s,
                                name: getPathLeafName(s),
                                expanded: false,
                                children: null,
                            }));
                            result.push({ ...node, expanded: true, children });
                        } catch {
                            result.push({ ...node, expanded: true, children: [] });
                        }
                    } else {
                        result.push({ ...node, expanded: !node.expanded });
                    }
                } else {
                    const updChildren = node.children
                        ? await updateNodes(node.children)
                        : node.children;
                    result.push({ ...node, children: updChildren });
                }
            }
            return result;
        }
        setNodes(await updateNodes(nodes));
    }

    function renderNodes(items: TreeNode[], depth: number): React.ReactNode {
        return items.map((node) => (
            <div key={node.path}>
                <button
                    type="button"
                    className={`flex w-full items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${selectedPath === node.path
                        ? "bg-primary/15 text-primary-light"
                        : "text-text-secondary hover:bg-surface-hover"
                        }`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={() => {
                        onSelect(node.path);
                        toggleNode(node.path);
                    }}
                >
                    {node.expanded ? (
                        <ChevronDown className="h-3 w-3 shrink-0" />
                    ) : (
                        <ChevronRight className="h-3 w-3 shrink-0" />
                    )}
                    {node.expanded ? (
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-warning" />
                    ) : (
                        <Folder className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    )}
                    <span className="truncate">{node.name}</span>
                </button>
                {node.expanded && node.children && renderNodes(node.children, depth + 1)}
            </div>
        ));
    }

    return (
        <div
            className={`${maxHeightClass} overflow-auto rounded-[5px] border-2 border-border bg-background p-1`}
        >
            {nodes.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-text-muted">
                    Selecciona una carpeta para navegar
                </div>
            ) : (
                renderNodes(nodes, 0)
            )}
        </div>
    );
}
