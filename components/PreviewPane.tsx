"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "stopped" | "installing" | "starting" | "ready" | "error";

interface ServerState {
  status: Status;
  url?: string;
  port?: number;
  error?: string;
  logs?: string[];
}

interface PreviewPaneProps {
  projectId: string;
  folderPath: string;
  initialPreviewPath?: string;
  canLaunch: boolean;
  scripts?: string[];
  height?: string;
}

export function PreviewPane({
  projectId,
  folderPath,
  initialPreviewPath,
  canLaunch,
  height = "420px",
}: PreviewPaneProps) {
  const [server, setServer] = useState<ServerState>({ status: "stopped" });
  const [showStatic, setShowStatic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const logRef = useRef<HTMLPreElement>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/server?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" });
      const data: ServerState = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Status request failed (${res.status})`);
      }
      setServer(data);
      return data.status;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read project status.";
      setServer({ status: "error", error: message });
      return "error" as Status;
    }
  }, [projectId]);

  // Initial status check (in case a server is already running)
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while installing / starting
  useEffect(() => {
    if (server.status !== "installing" && server.status !== "starting") return;
    const t = setInterval(fetchStatus, 1200);
    return () => clearInterval(t);
  }, [server.status, fetchStatus]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [server.logs]);

  // Esc exits fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const start = async () => {
    setBusy(true);
    setShowStatic(false);
    try {
      const res = await fetch("/api/server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", projectId, folderPath }),
      });
      const data = await res.json();
      if (!res.ok) setServer({ status: "error", error: data.error });
      else setServer(data);
    } catch (e: any) {
      setServer({ status: "error", error: e.message });
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Stop request failed (${res.status})`);
      setServer({ status: "stopped" });
      setFullscreen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not stop the project.";
      setServer((current) => ({ ...current, status: "error", error: message }));
    } finally {
      setBusy(false);
    }
  };

  const isLive = server.status === "ready" && !!server.url;
  const isWorking = server.status === "installing" || server.status === "starting";
  const iframeUrl = isLive ? server.url! : showStatic ? `/preview/${projectId}/` : null;

  const statusLabel: Record<Status, string> = {
    stopped: initialPreviewPath ? "Idle · build available" : "Idle",
    installing: "Installing dependencies…",
    starting: "Starting dev server…",
    ready: `Live · localhost:${server.port}`,
    error: "Failed",
  };

  const dotClass =
    server.status === "ready" ? "dot dot-live" :
    isWorking ? "dot dot-busy" :
    server.status === "error" ? "dot dot-error" : "dot";

  return (
    <div className={`pane ${fullscreen ? "pane-fullscreen" : ""}`}>
      {/* Toolbar */}
      <div className="pane-bar">
        <div className="pane-status">
          <span className={dotClass} />
          <span>{showStatic && !isLive ? "Static build preview" : statusLabel[server.status]}</span>
        </div>

        <div className="pane-actions">
          {iframeUrl && (
            <>
              <button className="icon-btn" onClick={() => setIframeKey((k) => k + 1)} title="Reload">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" /><path d="M21 3v5h-5" /></svg>
              </button>
              <button className="icon-btn" onClick={() => setFullscreen((f) => !f)} title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}>
                {fullscreen ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
                )}
              </button>
              <a className="icon-btn" href={iframeUrl} target="_blank" rel="noreferrer" title="Open in new tab">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
              </a>
            </>
          )}
          {showStatic && !isLive && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowStatic(false)}>Close</button>
          )}
          {(isLive || isWorking) && (
            <button className="btn btn-danger btn-sm" onClick={stop} disabled={busy}>Stop</button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="pane-body" style={{ height: fullscreen ? "calc(100vh - 52px)" : height }}>
        {iframeUrl ? (
          <iframe key={iframeKey} src={iframeUrl} className="pane-iframe" title={`${projectId} preview`} />
        ) : isWorking || server.status === "error" ? (
          <div className="pane-console">
            <div className="console-head">
              {isWorking ? <span className="spinner" /> : <span className="console-x">!</span>}
              <div>
                <strong>{server.status === "error" ? "Couldn't start this project" : statusLabel[server.status]}</strong>
                <p>
                  {server.status === "installing"
                    ? "Installing missing packages with this project's package manager."
                    : server.status === "starting"
                    ? "Compiling. The preview opens automatically when it's ready."
                    : server.error}
                </p>
              </div>
            </div>
            <pre ref={logRef} className="console-log">
              {(server.logs && server.logs.length ? server.logs : ["waiting for output…"]).join("\n")}
            </pre>
            {server.status === "error" && (
              <div className="console-actions">
                <button className="btn btn-primary btn-sm" onClick={start} disabled={busy}>Try again</button>
                {initialPreviewPath && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowStatic(true)}>View last build instead</button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="pane-empty">
            {canLaunch ? (
              <>
                <button className="launch-btn" onClick={start} disabled={busy}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" /></svg>
                </button>
                <span className="launch-label">Launch</span>
                <span className="launch-hint">Runs on your PC. Installs anything missing automatically.</span>
              </>
            ) : (
              <span className="launch-hint">
                {initialPreviewPath
                  ? "This project has a saved build you can preview."
                  : "No dev or start script found for this project."}
              </span>
            )}
            {initialPreviewPath && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: "0.9rem" }} onClick={() => setShowStatic(true)}>
                Or view existing build
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
