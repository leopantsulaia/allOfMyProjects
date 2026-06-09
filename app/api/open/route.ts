import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST(request: Request) {
  try {
    const { folderPath, action } = await request.json();

    if (!folderPath) {
      return NextResponse.json({ error: "Folder path is required" }, { status: 400 });
    }

    // Resolve the path to verify it is within the workspace
    const resolvedPath = path.resolve(folderPath);

    // Run the corresponding command
    if (action === "code") {
      exec(`code "${resolvedPath}"`, (error) => {
        if (error) {
          console.error("Failed to open VS Code:", error);
        }
      });
      return NextResponse.json({ success: true, message: "Opening in VS Code..." });
    } else if (action === "explorer") {
      exec(`explorer "${resolvedPath}"`, (error) => {
        if (error) {
          console.error("Failed to open Explorer:", error);
        }
      });
      return NextResponse.json({ success: true, message: "Opening in Explorer..." });
    } else {
      return NextResponse.json({ error: "Invalid action. Supported: code, explorer" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
