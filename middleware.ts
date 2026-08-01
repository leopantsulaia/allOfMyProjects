import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Skip Next.js hot-reloading / system / API / preview / project pages
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/preview") ||
    pathname.startsWith("/projects") ||
    pathname === "/" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check Referer header to see if request originated from an iframe preview page
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      // Check if the referer path matches /preview/[projectId]/...
      const previewMatch = refererUrl.pathname.match(/^\/preview\/([^/]+)/);
      if (previewMatch) {
        const projectId = previewMatch[1];
        
        // Determine if this is a document request (HTML) to redirect instead of rewrite
        const accept = request.headers.get("accept") || "";
        const isHtml = accept.includes("text/html") || pathname.endsWith(".html") || pathname.endsWith(".htm");

        if (isHtml) {
          // Redirect to update the browser URL inside the iframe
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = `/preview/${projectId}${pathname}`;
          return NextResponse.redirect(redirectUrl);
        } else {
          // Rewrite the pathname for static assets (images, js, css, glb, etc.)
          url.pathname = `/preview/${projectId}${pathname}`;
          return NextResponse.rewrite(url);
        }
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }

  return NextResponse.next();
}
