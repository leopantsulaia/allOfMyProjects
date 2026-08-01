import { NextRequest } from "next/server";
import { getProjectList } from "@/lib/projects";
import fs from "fs";
import path from "path";

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".html": "text/html",
    ".htm": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".pdf": "application/pdf",
  };
  return map[ext] || "application/octet-stream";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; file?: string[] } }
) {
  try {
    const { projectId, file } = params;
    const cleanFile = file ? file.filter((segment) => segment !== "") : [];
    const projects = await getProjectList();
    const project = projects.find((p) => p.id === projectId);

    if (!project) {
      return new Response("Project not found", { status: 404 });
    }

    // Determine the base preview directory
    const relativeDir = project.previewPath ? path.dirname(project.previewPath) : ".";
    const baseDir = path.resolve(project.folderPath, relativeDir);

    // Build the file path relative to the base directory
    let fileRelativePath = "";
    if (cleanFile.length > 0) {
      fileRelativePath = cleanFile.join("/");
    } else if (project.previewPath) {
      fileRelativePath = path.basename(project.previewPath);
    } else {
      fileRelativePath = "index.html";
    }

    let resolvedPath = path.resolve(baseDir, fileRelativePath);

    // Security check: ensure path is within the project base directory
    const normalizedResolved = resolvedPath.toLowerCase().replace(/\\/g, "/") + "/";
    const normalizedBaseDir = baseDir.toLowerCase().replace(/\\/g, "/") + "/";
    if (!normalizedResolved.startsWith(normalizedBaseDir)) {
      return new Response("Access Denied", { status: 403 });
    }

    // Check if path is a directory and has index.html
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
      const indexHtmlPath = path.join(resolvedPath, "index.html");
      if (fs.existsSync(indexHtmlPath)) {
        resolvedPath = indexHtmlPath;
      }
    }

    // Check if path exists. If not and it has no extension, fallback to main index.html for SPA router support
    if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
      const ext = path.extname(fileRelativePath);
      if (!ext) {
        // SPA routing fallback
        const mainIndexName = project.previewPath ? path.basename(project.previewPath) : "index.html";
        const fallbackIndex = path.resolve(baseDir, mainIndexName);
        if (fs.existsSync(fallbackIndex)) {
          resolvedPath = fallbackIndex;
        } else {
          return new Response(`Not Found: ${fileRelativePath}`, { status: 404 });
        }
      } else {
        return new Response(`Not Found: ${fileRelativePath}`, { status: 404 });
      }
    }

    const contentType = getMimeType(resolvedPath);

    if (contentType === "text/html") {
      let htmlContent = fs.readFileSync(resolvedPath, "utf8");

      // Rewrite absolute asset references starting with '/' (e.g. src="/assets/main.js")
      // to resolve correctly under the dynamic preview prefix '/preview/[projectId]/...'
      const prefix = `/preview/${projectId}`;
      htmlContent = htmlContent.replace(
        /(src|href|content)=["']\/([^"']*)["']/g,
        (match, attr, pathVal) => {
          if (
            pathVal.startsWith("http://") ||
            pathVal.startsWith("https://") ||
            pathVal.startsWith("//")
          ) {
            return match;
          }
          return `${attr}="${prefix}/${pathVal}"`;
        }
      );

      return new Response(htmlContent, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      });
    }

    const fileBuffer = fs.readFileSync(resolvedPath);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        // Disable aggressive caching for local development previews
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error: any) {
    return new Response(`Error serving preview: ${error.message}`, { status: 500 });
  }
}
