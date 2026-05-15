import { compareDriveAwarePaths, getPathLeafName, normalizePathSeparators } from "./pathUtils";

export interface PathTreeNode {
  path: string;
  name: string;
  expanded: boolean;
  children: PathTreeNode[] | null;
}

function pathSegments(path: string): Array<{ path: string; name: string }> {
  const normalized = normalizePathSeparators(path).replace(/[\\]+$/, "");
  const driveMatch = normalized.match(/^([A-Za-z]:)(?:\\(.*))?$/);
  if (!driveMatch) {
    return [{ path: normalized, name: getPathLeafName(normalized) }];
  }

  const drive = `${driveMatch[1].toUpperCase()}\\`;
  const rest = driveMatch[2] ?? "";
  const segments: Array<{ path: string; name: string }> = [{ path: drive, name: drive }];
  let current = drive.replace(/[\\]+$/, "");

  for (const part of rest.split("\\").filter(Boolean)) {
    current = `${current}\\${part}`;
    segments.push({ path: current, name: part });
  }

  return segments;
}

function sortTree(nodes: PathTreeNode[]): PathTreeNode[] {
  return nodes
    .sort((a, b) => compareDriveAwarePaths(a.path, b.path))
    .map((node) => ({
      ...node,
      children: node.children ? sortTree(node.children) : node.children,
    }));
}

export function buildDrivePathTree(paths: string[]): PathTreeNode[] {
  const roots: PathTreeNode[] = [];
  const byPath = new Map<string, PathTreeNode>();

  for (const rawPath of [...paths].sort(compareDriveAwarePaths)) {
    let siblings = roots;
    for (const segment of pathSegments(rawPath)) {
      const key = segment.path.toLowerCase();
      let node = byPath.get(key);
      if (!node) {
        node = {
          path: segment.path,
          name: segment.name,
          expanded: true,
          children: [],
        };
        byPath.set(key, node);
        siblings.push(node);
      }

      if (node.children === null) node.children = [];
      siblings = node.children;
    }
  }

  return sortTree(roots);
}
