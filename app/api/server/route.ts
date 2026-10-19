import { NextResponse } from "next/server";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import net from "net";

export const dynamic = "force-dynamic";

type Status = "installing" | "starting" | "ready" | "error" | "stopped";

interface ServerEntry {
  child?: ChildProcess;
  port: number;
  url: string;
  status: Status;
  logs: string[];
  error?: string;
  startedAt: number;
}

type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

// Survive Next.js hot reloads
const g = globalThis as unknown as { __devServers?: Map<string, ServerEntry> };
const servers = (g.__devServers ??= new Map<string, ServerEntry>());

const isWin = process.platform === "win32";
const workspaceRoot = path.resolve(process.cwd(), "..");

function log(entry: ServerEntry, text: string) {
  for (const line of text.split(/\r?\n/)) {
    // strip ANSI color codes
    const clean = line.replace(/\x1b\[[0-9;]*m/g, "").trimEnd();
    if (clean) entry.logs.push(clean);
  }
  if (entry.logs.length > 200) entry.logs.splice(0, entry.logs.length - 200);
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.listen(port, () => srv.close(() => resolve(true)));
  });
}

async function findFreePort(start = 4100): Promise<number> {
  const used = new Set([...servers.values()].map((s) => s.port));
  for (let p = start; p < start + 500; p++) {
    if (!used.has(p) && (await isPortFree(p))) return p;
  }
  throw new Error("No free port found");
}

function portResponds(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(700);
    sock.once("connect", () => { sock.destroy(); resolve(true); });
    sock.once("timeout", () => { sock.destroy(); resolve(false); });
    sock.once("error", () => { sock.destroy(); resolve(false); });
    sock.connect(port, "127.0.0.1");
  });
}

function killTree(child?: ChildProcess) {
  if (!child?.pid) return;
  try {
    if (isWin) spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"]);
    else child.kill("SIGTERM");
  } catch {}
}

function runInstall(entry: ServerEntry, cwd: string, manager: PackageManager): Promise<boolean> {
  return new Promise((resolve) => {
    const installArgs = manager === "npm"
      ? ["install", "--no-audit", "--no-fund", "--loglevel=error"]
      : ["install"];
    log(entry, `> ${manager} ${installArgs.join(" ")} (first launch, this can take a minute or two)`);
    const child = spawn(manager, installArgs, {
      cwd,
      shell: true,
      env: { ...process.env, NODE_ENV: "development" },
    });
    entry.child = child;
    child.stdout?.on("data", (d) => log(entry, d.toString()));
    child.stderr?.on("data", (d) => log(entry, d.toString()));
    child.on("close", (code) => resolve(code === 0));
    child.on("error", (e) => { log(entry, String(e)); resolve(false); });
  });
}

function getPackageManager(folderPath: string, pkg: Record<string, unknown>): PackageManager {
  const declared = typeof pkg.packageManager === "string"
    ? pkg.packageManager.split("@")[0]
    : undefined;
  if (declared === "npm" || declared === "pnpm" || declared === "yarn" || declared === "bun") {
    return declared;
  }
  if (fs.existsSync(path.join(folderPath, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(folderPath, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(folderPath, "bun.lockb")) || fs.existsSync(path.join(folderPath, "bun.lock"))) {
    return "bun";
  }
  return "npm";
}

function buildRunCommand(scripts: Record<string, string>, manager: PackageManager, port: number) {
  const name = scripts.dev ? "dev" : scripts.start ? "start" : null;
  if (!name) return null;
  const command = scripts[name];
  const args = ["run", name];

  if (/\bnext\b/.test(command)) {
    args.push(...(manager === "npm" || manager === "pnpm" ? ["--"] : []), "-p", String(port));
  } else if (/\bvite\b/.test(command)) {
    args.push(...(manager === "npm" || manager === "pnpm" ? ["--"] : []), "--port", String(port), "--strictPort", "--host", "127.0.0.1");
  } else if (/webpack.*serve|webpack-dev-server/.test(command)) {
    args.push(...(manager === "npm" || manager === "pnpm" ? ["--"] : []), "--port", String(port));
  }

  if (manager === "yarn" || manager === "bun") {
    args.splice(0, 0, "run");
    if (args[1] === "run") args.splice(1, 1);
  }
  return { name, args };
}

function hasScriptBinary(folderPath: string, script: string) {
  const command = script.trim().match(/^(?:[\w-]+=\S+\s+)*([^\s]+)/)?.[1];
  if (!command) return true;

  const binaryPath = path.join(
    folderPath,
    "node_modules",
    ".bin",
    isWin ? `${command}.cmd` : command,
  );
  return fs.existsSync(binaryPath);
}

function hasInstalledDependencies(
  folderPath: string,
  pkg: Record<string, unknown>,
) {
  const dependencies = [
    pkg.dependencies,
    pkg.devDependencies,
  ].filter(
    (value): value is Record<string, string> =>
      typeof value === "object" && value !== null,
  );
  const dependencyNames = dependencies.flatMap((group) => Object.keys(group));

  return dependencyNames.every((name) => {
    const packagePath = name.split("/");
    let currentPath = folderPath;

    while (true) {
      const relativePath = path.relative(workspaceRoot, currentPath);
      if (
        relativePath === ".." ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath)
      ) {
        break;
      }

      if (
        fs.existsSync(
          path.join(currentPath, "node_modules", ...packagePath),
        )
      ) {
        return true;
      }

      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) break;
      currentPath = parentPath;
    }

    return false;
  });
}

async function launch(projectId: string, folderPath: string) {
  const pkg = JSON.parse(fs.readFileSync(path.join(folderPath, "package.json"), "utf8"));
  const scripts: Record<string, string> = pkg.scripts || {};
  const manager = getPackageManager(folderPath, pkg);
  const port = await findFreePort();

  const entry: ServerEntry = {
    port,
    url: `http://127.0.0.1:${port}`,
    status: "starting",
    logs: [],
    startedAt: Date.now(),
  };
  servers.set(projectId, entry);

  const run = buildRunCommand(scripts, manager, port);
  if (!run) {
    entry.status = "error";
    entry.error = "This project has no 'dev' or 'start' script in package.json.";
    return;
  }

  if (
    !hasInstalledDependencies(folderPath, pkg) ||
    !hasScriptBinary(folderPath, scripts[run.name])
  ) {
    entry.status = "installing";
    const ok = await runInstall(entry, folderPath, manager);
    // status may have been set to "stopped" by a concurrent stop request
    if (servers.get(projectId) !== entry || (entry.status as Status) === "stopped") return;
    if (!ok) {
      entry.status = "error";
      entry.error = `${manager} install failed. See logs below.`;
      return;
    }
    if (!hasScriptBinary(folderPath, scripts[run.name])) {
      entry.status = "error";
      entry.error = `Dependencies installed, but the "${scripts[run.name].trim().split(/\s+/)[0]}" command is still missing.`;
      return;
    }
  }

  entry.status = "starting";
  log(entry, `> ${manager} ${run.args.join(" ")} (port ${port})`);

  const child = spawn(manager, run.args, {
    cwd: folderPath,
    shell: true,
    env: {
      ...process.env,
      PORT: String(port),
      BROWSER: "none", // stop CRA from opening a new browser tab
      HOST: "127.0.0.1",
      NODE_ENV: "development",
      FORCE_COLOR: "0",
    },
  });
  entry.child = child;
  child.stdout?.on("data", (d) => log(entry, d.toString()));
  child.stderr?.on("data", (d) => log(entry, d.toString()));
  child.on("error", (error) => {
    if (entry.status === "stopped") return;
    log(entry, error.message);
    entry.status = "error";
    entry.error = `Could not run ${manager}. Make sure it is installed and available on PATH.`;
  });
  child.on("close", (code) => {
    if (entry.status === "stopped") return;
    entry.status = "error";
    entry.error = `Dev server exited (code ${code}). See logs below.`;
  });

  // Poll until the port responds (up to 3 minutes for slow CRA builds)
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (entry.status !== "starting") return;
    if (await portResponds(port)) {
      entry.status = "ready";
      log(entry, `✓ Ready at ${entry.url}`);
      return;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  entry.status = "error";
  entry.error = "Timed out waiting for the dev server to start.";
}

function serialize(entry?: ServerEntry) {
  if (!entry) return { status: "stopped" as Status };
  return {
    status: entry.status,
    url: entry.url,
    port: entry.port,
    error: entry.error,
    logs: entry.logs.slice(-40),
  };
}

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (projectId) return NextResponse.json(serialize(servers.get(projectId)));

  const all: Record<string, ReturnType<typeof serialize>> = {};
  for (const [id, e] of servers) all[id] = serialize(e);
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  try {
    const { action, projectId, folderPath } = await request.json();
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    if (action === "stop") {
      const e = servers.get(projectId);
      if (e) {
        e.status = "stopped";
        killTree(e.child);
        servers.delete(projectId);
      }
      return NextResponse.json({ status: "stopped" });
    }

    if (action === "start") {
      const resolved = path.resolve(folderPath || "");
      const inWorkspace = resolved.toLowerCase().startsWith(workspaceRoot.toLowerCase() + path.sep);
      const expectedId = path
        .relative(workspaceRoot, resolved)
        .split(path.sep)
        .map((segment) => segment.toLowerCase().replace(/\s+/g, "-"))
        .join("--");
      if (
        !inWorkspace ||
        expectedId !== projectId ||
        !fs.existsSync(path.join(resolved, "package.json"))
      ) {
        return NextResponse.json({ error: "No package.json found for this project." }, { status: 400 });
      }

      const existing = servers.get(projectId);
      if (existing && existing.status !== "error") {
        return NextResponse.json(serialize(existing));
      }
      if (existing) killTree(existing.child);

      // Fire and forget; the client polls GET for progress
      launch(projectId, resolved).catch((err) => {
        const e = servers.get(projectId);
        if (e) { e.status = "error"; e.error = String(err?.message || err); }
      });

      await new Promise((r) => setTimeout(r, 150));
      return NextResponse.json(serialize(servers.get(projectId)));
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
