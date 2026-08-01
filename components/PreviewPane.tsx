"use client";

import { useState } from "react";

interface PreviewPaneProps {
  projectId: string;
  folderPath: string;
  initialPreviewPath?: string;
  hasPackageJson: boolean;
  height?: string;
}

export function PreviewPane({
  projectId,
  folderPath,
  initialPreviewPath,
  hasPackageJson,
  height = "450px",
}: PreviewPaneProps) {
  const [previewAvailable, setPreviewAvailable] = useState(!!initialPreviewPath);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleBuild = async () => {
    setIsBuilding(true);
    setError(null);
    try {
      const response = await fetch("/api/build", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderPath }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPreviewAvailable(true);
        // Force iframe reload by changing key
        setIframeKey((prev) => prev + 1);
      } else {
        setError(data.details || data.error || "Failed to build the project.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during the build.");
    } finally {
      setIsBuilding(false);
    }
  };

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const previewUrl = `/preview/${projectId}/`;

  return (
    <div
      className={isFullscreen ? "preview-fullscreen" : ""}
      style={{
        marginTop: "2rem",
        border: "1px solid rgba(148, 163, 184, 0.12)",
        borderRadius: "1.5rem",
        background: "rgba(15, 23, 42, 0.95)",
        boxShadow: "0 24px 80px rgba(0, 0, 0, 0.25)",
        overflow: "hidden",
        position: isFullscreen ? "fixed" : "relative",
        top: isFullscreen ? 0 : "auto",
        left: isFullscreen ? 0 : "auto",
        width: isFullscreen ? "100vw" : "100%",
        height: isFullscreen ? "100vh" : "auto",
        zIndex: isFullscreen ? 9999 : "auto",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Header Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "between",
          padding: "1rem 1.5rem",
          background: "rgba(30, 41, 59, 0.5)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexGrow: 1 }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: previewAvailable ? "#10b981" : "#f59e0b",
              boxShadow: previewAvailable
                ? "0 0 10px rgba(16, 185, 129, 0.6)"
                : "0 0 10px rgba(245, 158, 11, 0.6)",
            }}
          />
          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
            {previewAvailable ? "Live Preview" : "Build Preview Required"}
          </span>
          {previewAvailable && (
            <span
              style={{
                fontSize: "0.8rem",
                color: "#94a3b8",
                background: "rgba(148, 163, 184, 0.1)",
                padding: "0.2rem 0.6rem",
                borderRadius: "6px",
                fontFamily: "monospace",
              }}
            >
              {previewUrl}
            </span>
          )}
        </div>

        {previewAvailable && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleRefresh}
              className="project-link"
              style={{
                background: "rgba(148, 163, 184, 0.15)",
                color: "#e2e8f0",
                border: "none",
                padding: "0.45rem 0.85rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="project-link"
              style={{
                background: "rgba(148, 163, 184, 0.15)",
                color: "#e2e8f0",
                border: "none",
                padding: "0.45rem 0.85rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isFullscreen ? (
                  <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
                ) : (
                  <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                )}
              </svg>
              {isFullscreen ? "Exit Full" : "Fullscreen"}
            </button>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="project-link"
              style={{
                background: "rgba(59, 130, 246, 0.18)",
                color: "#bfdbfe",
                padding: "0.45rem 0.85rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              New Tab
            </a>
          </div>
        )}
      </div>

      {/* Main Content Pane */}
      <div
        style={{
          flexGrow: 1,
          height: isFullscreen ? "calc(100vh - 57px)" : height,
          position: "relative",
          background: "#0d1117",
        }}
      >
        {previewAvailable ? (
          <iframe
            key={iframeKey}
            src={previewUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              background: "#ffffff", // white background for the web app inside iframe
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            {isBuilding ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    border: "4px solid rgba(59, 130, 246, 0.2)",
                    borderTopColor: "#3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <style jsx global>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
                <div>
                  <h3 style={{ margin: "0 0 0.5rem" }}>Compiling App...</h3>
                  <p style={{ color: "#94a3b8", fontSize: "0.95rem", maxWidth: "45ch", margin: 0 }}>
                    Running `npm install` and `npm run build` inside your project directory. This may take up to a minute...
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", maxWidth: "500px" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 0.5rem" }}>Preview Not Compiled</h3>
                  <p style={{ color: "#cbd5e1", fontSize: "0.95rem", margin: "0 0 1.5rem" }}>
                    {hasPackageJson
                      ? "This project is a React/Web application but hasn't built a production release yet. Compile the project to activate the live preview."
                      : "This folder does not contain a package.json build script or index.html to preview directly. Run the app externally using VS Code or explorer."}
                  </p>
                </div>

                {hasPackageJson && (
                  <button
                    onClick={handleBuild}
                    className="project-link vscode-btn"
                    style={{
                      border: "none",
                      outline: "none",
                      cursor: "pointer",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "999px",
                      fontSize: "1rem",
                      fontWeight: "600",
                      background: "rgba(59, 130, 246, 0.2)",
                      color: "#60a5fa",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "rgba(59, 130, 246, 0.4)",
                      boxShadow: "0 4px 14px rgba(59, 130, 246, 0.15)",
                    }}
                  >
                    Build & Preview App
                  </button>
                )}

                {error && (
                  <div
                    style={{
                      marginTop: "1.5rem",
                      padding: "1rem",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#fecaca",
                      borderRadius: "8px",
                      fontSize: "0.88rem",
                      textAlign: "left",
                      width: "100%",
                      maxHeight: "150px",
                      overflowY: "auto",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <strong>Build Error:</strong> {error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
