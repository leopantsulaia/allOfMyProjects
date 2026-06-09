"use client";

import { useState } from "react";

interface LaunchControlsProps {
  folderPath: string;
  className?: string;
  showLabels?: boolean;
}

export function LaunchControls({ folderPath, className = "", showLabels = true }: LaunchControlsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleLaunch = async (action: "code" | "explorer") => {
    setLoadingAction(action);
    setStatus(null);
    try {
      const response = await fetch("/api/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderPath, action }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStatus({ type: "success", message: data.message || `Successfully requested ${action}` });
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus({ type: "error", message: data.error || `Failed to perform ${action}` });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Network error occurred" });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="button-row" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          onClick={() => handleLaunch("code")}
          disabled={loadingAction !== null}
          className="project-link launch-btn vscode-btn"
          title="Open in Visual Studio Code"
          style={{
            cursor: "pointer",
            border: "none",
            outline: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(37, 99, 235, 0.2)",
            color: "#60a5fa",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "rgba(37, 99, 235, 0.4)",
            padding: "0.65rem 1.2rem",
            borderRadius: "999px",
            fontSize: "0.9rem",
            fontWeight: "600",
            transition: "all 0.2s ease",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ flexShrink: 0 }}
          >
            <path d="M23.986 6.568l-3.32-3.292a1.002 1.002 0 00-.712-.294 1.01 1.01 0 00-.71.294L12 10.518 4.756 3.276A1.003 1.003 0 003.334 3.28L.018 6.574a1.007 1.007 0 000 1.42l7.24 7.234-7.24 7.234a1.007 1.007 0 000 1.42l3.316 3.294c.188.188.442.294.708.294a1.004 1.004 0 00.71-.294L12 18.026l7.244 7.242c.188.188.442.294.708.294a1.004 1.004 0 00.71-.294l3.32-3.294a1.007 1.007 0 000-1.42l-7.24-7.234 7.244-7.234a1.007 1.007 0 000-1.42zM12 13.926l-3.414-3.412L12 7.102l3.414 3.412L12 13.926z" />
          </svg>
          {showLabels && (loadingAction === "code" ? "Opening Code..." : "Open in VS Code")}
        </button>

        <button
          onClick={() => handleLaunch("explorer")}
          disabled={loadingAction !== null}
          className="project-link launch-btn explorer-btn"
          title="Open in File Explorer"
          style={{
            cursor: "pointer",
            border: "none",
            outline: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(148, 163, 184, 0.15)",
            color: "#e2e8f0",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "rgba(148, 163, 184, 0.3)",
            padding: "0.65rem 1.2rem",
            borderRadius: "999px",
            fontSize: "0.9rem",
            fontWeight: "600",
            transition: "all 0.2s ease",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          {showLabels && (loadingAction === "explorer" ? "Opening Explorer..." : "Open Folder")}
        </button>
      </div>

      {status && (
        <div
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            fontSize: "0.85rem",
            color: status.type === "success" ? "#a7f3d0" : "#fecaca",
            background: status.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${status.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            display: "inline-block",
            maxWidth: "max-content",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
