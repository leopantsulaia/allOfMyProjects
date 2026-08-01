import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const runCommand = (cmd: string, cwd: string): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    // 3 minute timeout for installing/building
    const env = { ...process.env, NODE_ENV: "production" as const };
    exec(cmd, { cwd, timeout: 180000, env }, (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

export async function POST(request: Request) {
  try {
    const { folderPath } = await request.json();

    if (!folderPath) {
      return NextResponse.json({ error: "Folder path is required" }, { status: 400 });
    }

    const resolvedPath = path.resolve(folderPath);
    const normalizedResolved = resolvedPath.toLowerCase().replace(/\\/g, "/") + "/";

    const appRoot = process.cwd();
    const workspaceRoot = path.basename(appRoot) === "allOfMyProjects"
      ? path.resolve(appRoot, "..")
      : appRoot;
    const normalizedWorkspace = workspaceRoot.toLowerCase().replace(/\\/g, "/") + "/";

    // Security check: ensure path is within the workspace
    if (!normalizedResolved.startsWith(normalizedWorkspace)) {
      return NextResponse.json({ error: "Invalid path location" }, { status: 403 });
    }

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: "Directory does not exist" }, { status: 404 });
    }

    const hasPackageJson = fs.existsSync(path.join(resolvedPath, "package.json"));
    if (!hasPackageJson) {
      return NextResponse.json({ error: "No package.json found in project. Cannot build." }, { status: 400 });
    }

    const hasNodeModules = fs.existsSync(path.join(resolvedPath, "node_modules"));
    const hasYarnLock = fs.existsSync(path.join(resolvedPath, "yarn.lock"));
    const hasPnpmLock = fs.existsSync(path.join(resolvedPath, "pnpm-lock.yaml"));

    let installCmd = "npm install";
    let buildCmd = "npm run build";

    if (hasYarnLock) {
      installCmd = "yarn install";
      buildCmd = "yarn build";
    } else if (hasPnpmLock) {
      installCmd = "pnpm install";
      buildCmd = "pnpm run build";
    }
    
    let installResult = "";
    if (!hasNodeModules) {
      console.log(`Running ${installCmd} in ${resolvedPath}...`);
      try {
        const { stdout } = await runCommand(installCmd, resolvedPath);
        installResult = stdout;
      } catch (err: any) {
        return NextResponse.json({
          error: `Failed to install dependencies (${installCmd})`,
          details: err.stderr || err.message,
        }, { status: 500 });
      }
    }

    console.log(`Running ${buildCmd} in ${resolvedPath}...`);
    try {
      const { stdout } = await runCommand(buildCmd, resolvedPath);
      return NextResponse.json({
        success: true,
        message: "Project built successfully!",
        installResult,
        buildResult: stdout,
      });
    } catch (err: any) {
      return NextResponse.json({
        error: `Failed to compile/build project (${buildCmd})`,
        details: err.stderr || err.message,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
