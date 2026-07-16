import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";

export interface TreeFileItem {
    id: string;
    path: string;
    relativePath: string;
    label: string;
    meta?: string;
}

interface TreeNode {
    id: string;
    label: string;
    path: string;
    kind: "folder" | "file";
    item?: TreeFileItem;
    children: TreeNode[];
}

function buildTree(items: TreeFileItem[]): TreeNode[] {
    const root: TreeNode[] = [];

    for (const item of items) {
        const segments = item.relativePath.split(/[\\/]+/).filter(Boolean);
        let currentLevel = root;
        let currentPath = "";

        for (const [index, segment] of segments.entries()) {
            currentPath = currentPath ? `${currentPath}/${segment}` : segment;
            const isLeaf = index === segments.length - 1;
            let node = currentLevel.find((entry) => entry.label === segment && entry.kind === (isLeaf ? "file" : "folder"));

            if (!node) {
                node = {
                    id: `${isLeaf ? "file" : "folder"}:${currentPath}`,
                    label: segment,
                    path: currentPath,
                    kind: isLeaf ? "file" : "folder",
                    item: isLeaf ? item : undefined,
                    children: [],
                };
                currentLevel.push(node);
            }

            currentLevel = node.children;
        }
    }

    const sortNodes = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => {
            if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
            return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" });
        });
        for (const child of nodes) sortNodes(child.children);
    };

    sortNodes(root);
    return root;
}

function collectExpandableIds(nodes: TreeNode[]): string[] {
    const ids: string[] = [];
    for (const node of nodes) {
        if (node.kind === "folder") {
            ids.push(node.id);
            ids.push(...collectExpandableIds(node.children));
        }
    }
    return ids;
}

export function TreeFileNavigator({
    items,
    selectedId,
    onSelect,
    emptyLabel,
}: {
    items: TreeFileItem[];
    selectedId: string | null;
    onSelect: (item: TreeFileItem) => void;
    emptyLabel: string;
}) {
    const tree = useMemo(() => buildTree(items), [items]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const expanded = useMemo(() => {
        if (expandedFolders.size > 0) return expandedFolders;
        return new Set(collectExpandableIds(tree));
    }, [expandedFolders, tree]);

    const toggleFolder = (id: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const renderNodes = (nodes: TreeNode[], depth: number): ReactNode => nodes.map((node) => {
        if (node.kind === "folder") {
            const isOpen = expanded.has(node.id);
            return (
                <div key={node.id}>
                    <button
                        type="button"
                        onClick={() => toggleFolder(node.id)}
                        className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[12px] text-text-secondary hover:bg-surface-hover"
                        style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    >
                        {isOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                        {isOpen ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-warning" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-text-muted" />}
                        <span className="truncate">{node.label}</span>
                    </button>
                    {isOpen ? renderNodes(node.children, depth + 1) : null}
                </div>
            );
        }

        const item = node.item!;
        const isSelected = selectedId === item.id;
        return (
            <button
                key={node.id}
                type="button"
                onClick={() => onSelect(item)}
                className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[12px] transition-colors ${isSelected ? "bg-primary/12 text-primary-light" : "text-text-secondary hover:bg-surface-hover"}`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                title={item.relativePath}
            >
                <FileText className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                <span className="truncate">{item.label}</span>
                {item.meta ? <span className="ml-auto shrink-0 text-xs text-text-muted">{item.meta}</span> : null}
            </button>
        );
    });

    return (
        <div className="rounded-[5px] border-2 border-border bg-background p-1">
            {tree.length === 0 ? (
                <div className="py-4 text-center text-xs text-text-muted">{emptyLabel}</div>
            ) : (
                renderNodes(tree, 0)
            )}
        </div>
    );
}
