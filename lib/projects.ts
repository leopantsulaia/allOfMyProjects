import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export type ProjectInfo = {
  id: string;
  name: string;
  description: string;
  folder: string;
  folderPath: string;
  folderUrl: string;
  tags: string[];
  status: "Detected" | "Custom";
  scripts: string[];
  liveUrlGuess?: string;
  previewPath?: string;
};

function looksLikeProject(folderPath: string) {
  const indicators = [
    "package.json",
    "pyproject.toml",
    "README.md",
    "src",
    "app",
    "public",
  ];
  try {
    const entries = fs.readdirSync(folderPath);
    return indicators.some((item) => entries.includes(item));
  } catch {
    return false;
  }
}

function readJson(filePath: string) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeTag(tag: string) {
  return tag.trim();
}

function detectLiveUrl(pkg: Record<string, unknown> | null) {
  if (!pkg) return undefined;

  const deps = pkg.dependencies as Record<string, string> | undefined;
  const devDeps = pkg.devDependencies as Record<string, string> | undefined;
  const scripts = pkg.scripts as Record<string, string> | undefined;

  if (scripts?.dev?.includes("next")) return "http://localhost:3000";
  if (scripts?.dev?.includes("vite")) return "http://localhost:5173";
  if (scripts?.start?.includes("react-scripts")) return "http://localhost:3000";
  if (deps?.next || devDeps?.next) return "http://localhost:3000";
  if (deps?.vite || devDeps?.vite) return "http://localhost:5173";
  if (deps?.["react-scripts"] || devDeps?.["react-scripts"])
    return "http://localhost:3000";

  return undefined;
}

function getPreviewPath(fullPath: string) {
  const candidatePaths = [
    "build/index.html",
    "dist/index.html",
    "out/index.html",
    "build/index.htm",
    "index.html",
    "index.htm",
  ];

  return candidatePaths.find((relative) =>
    fs.existsSync(path.join(fullPath, relative)),
  );
}

export async function getProjectList(): Promise<ProjectInfo[]> {
  const workspaceRoot = path.resolve(process.cwd(), "..");
  const ignoredFolders = new Set([
    "allOfMyProjects",
    "azure",
    "__pycache__",
    "copy",
    "trash",
    ".git",
    "node_modules",
    ".next",
    "build",
    "dist",
    "out",
    "coverage",
  ]);

  function findProjectFolders(parentPath: string): string[] {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(parentPath, { withFileTypes: true });
    } catch (error) {
      console.warn(`Could not inspect project folder "${parentPath}".`, error);
      return [];
    }

    return entries
      .filter(
        (entry) =>
          entry.isDirectory() &&
          !ignoredFolders.has(entry.name) &&
          !entry.name.startsWith("."),
      )
      .flatMap((entry) => {
        const fullPath = path.join(parentPath, entry.name);
        const packageJsonPath = path.join(fullPath, "package.json");
        const pkg = fs.existsSync(packageJsonPath)
          ? readJson(packageJsonPath)
          : null;
        const scripts =
          pkg?.scripts && typeof pkg.scripts === "object"
            ? (pkg.scripts as Record<string, unknown>)
            : {};
        const hasRunnableScript = ["dev", "start", "build"].some(
          (script) => typeof scripts[script] === "string",
        );

        if (looksLikeProject(fullPath) && (!pkg || hasRunnableScript)) {
          return [fullPath];
        }

        return findProjectFolders(fullPath);
      });
  }

  const projects = findProjectFolders(workspaceRoot)
    .map((fullPath) => {
      const folder = path.relative(workspaceRoot, fullPath);

      const pkg = fs.existsSync(path.join(fullPath, "package.json"))
        ? readJson(path.join(fullPath, "package.json"))
        : null;

      const tags = new Set<string>();
      if (pkg) {
        const deps = pkg.dependencies as Record<string, string> | undefined;
        const devDeps = pkg.devDependencies as
          | Record<string, string>
          | undefined;
        const allDeps = { ...deps, ...devDeps };

        if (allDeps.next) tags.add("Next.js");
        if (allDeps.react) tags.add("React");
        if (allDeps.vite) tags.add("Vite");
        if (allDeps.typescript) tags.add("TypeScript");
        if (allDeps["react-scripts"]) tags.add("Create React App");
        if (allDeps.three) tags.add("3D");
        if (allDeps.tailwindcss) tags.add("Tailwind");
      }

      if (fs.existsSync(path.join(fullPath, "pyproject.toml")))
        tags.add("Python");
      if (
        fs.existsSync(path.join(fullPath, "app")) ||
        fs.existsSync(path.join(fullPath, "src"))
      )
        tags.add("Web");
      if (
        folder.toLowerCase().includes("canvas") ||
        folder.toLowerCase().includes("game")
      )
        tags.add("Canvas");
      if (folder.toLowerCase().includes("ts")) tags.add("TypeScript");
      if (folder.toLowerCase().includes("python")) tags.add("Python");

      const liveUrlGuess = detectLiveUrl(pkg);
      const previewPath = getPreviewPath(fullPath);
      const folderUrl = pathToFileURL(fullPath).href;
      const id = folder
        .split(path.sep)
        .map((segment) => segment.toLowerCase().replace(/\s+/g, "-"))
        .join("--");

      const project: ProjectInfo = {
        id,
        name: pkg?.name ? String(pkg.name) : folder,
        description: pkg?.description
          ? String(pkg.description)
          : `A local workspace project discovered in ${folder}.`,
        folder,
        folderPath: fullPath,
        folderUrl,
        tags: Array.from(tags).length
          ? Array.from(tags).map(normalizeTag)
          : ["Local project"],
        status: "Detected",
        scripts: pkg
          ? Object.keys((pkg.scripts as Record<string, string>) || {})
          : [],
        liveUrlGuess,
        previewPath,
      };

      return project;
    });

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}
