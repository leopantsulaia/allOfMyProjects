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

const projectHints = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Canvas",
  "Python",
];

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
    "public/index.html",
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
  const folderNames = fs
    .readdirSync(workspaceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== "allOfMyProjects" && !name.startsWith("."));

  const projects = folderNames
    .map((folder) => {
      const fullPath = path.join(workspaceRoot, folder);
      if (!looksLikeProject(fullPath)) return null;

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

      const project: ProjectInfo = {
        id: folder.toLowerCase().replace(/\s+/g, "-"),
        name: pkg?.name ? String(pkg.name) : folder,
        description: pkg?.description
          ? String(pkg.description)
          : `A local workspace project discovered in ${folder}.`,
        folder,
        folderPath: fullPath,
        folderUrl,
        tags: Array.from(tags).length
          ? Array.from(tags).map(normalizeTag)
          : [projectHints[Math.floor(Math.random() * projectHints.length)]],
        status: "Detected",
        scripts: pkg
          ? Object.keys((pkg.scripts as Record<string, string>) || {})
          : [],
        liveUrlGuess,
        previewPath,
      };

      return project;
    })
    .filter((entry): entry is ProjectInfo => entry !== null);

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}
