import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const runCommand = (cmd: string, cwd: string): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    // 3 minute timeout for installing/building
    exec(cmd, { cwd, timeout: 180000 }, (error, stdout, stderr) => {
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

    // Security check: ensure path is within the workspace
    if (
      !resolvedPath.startsWith("Z:\\Code") &&
      !resolvedPath.startsWith("z:\\Code") &&
      !resolvedPath.startsWith("z:/Code") &&
      !resolvedPath.startsWith("Z:/Code")
    ) {
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
    
    let installResult = "";
    if (!hasNodeModules) {
      console.log(`Running npm install in ${resolvedPath}...`);
      try {
        const { stdout } = await runCommand("npm install", resolvedPath);
        installResult = stdout;
      } catch (err: any) {
        return NextResponse.json({
          error: "Failed to install dependencies (npm install)",
          details: err.stderr || err.message,
        }, { status: 500 });
      }
    }

    console.log(`Running npm run build in ${resolvedPath}...`);
    try {
      const { stdout } = await runCommand("npm run build", resolvedPath);
      return NextResponse.json({
        success: true,
        message: "Project built successfully!",
        installResult,
        buildResult: stdout,
      });
    } catch (err: any) {
      return NextResponse.json({
        error: "Failed to compile/build project (npm run build)",
        details: err.stderr || err.message,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
