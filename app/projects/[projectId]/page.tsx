import { notFound } from "next/navigation";
import { getProjectList, type ProjectInfo } from "@/lib/projects";
import { PreviewPane } from "@/components/PreviewPane";

export const dynamic = "force-dynamic";

function renderScriptList(scripts: string[]) {
  if (scripts.length === 0) {
    return <p>No npm scripts detected.</p>;
  }

  return (
    <ul className="meta-list">
      {scripts.map((script) => (
        <li key={script}>{script}</li>
      ))}
    </ul>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const projects = await getProjectList();
  const project = projects.find((item) => item.id === params.projectId);

  if (!project) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Project details</p>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
      </section>

      <section className="content-block">
        <div className="section-header">
          <div>
            <p className="eyebrow">Launch options</p>
            <h2>Open this app</h2>
          </div>
        </div>

        <article className="card">
          <div className="card-header">
            <div>
              <h3>Quick launch</h3>
              <p className="project-copy">
                Use the buttons below to inspect the source, open the folder, or
                visit the guessed local dev URL.
              </p>
            </div>
          </div>

          <div className="button-row" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <a
              className="project-link"
              href={`/preview/${project.id}/`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.2rem",
                borderRadius: "999px",
                fontSize: "0.9rem",
                fontWeight: "600",
                background: "rgba(59, 130, 246, 0.18)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                color: "#bfdbfe",
                textDecoration: "none",
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
                style={{ marginRight: "2px" }}
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Launch Preview in New Tab
            </a>
            {project.liveUrlGuess && (
              <a
                className="project-link"
                href={project.liveUrlGuess}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.65rem 1.2rem",
                  borderRadius: "999px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  background: "rgba(16, 185, 129, 0.18)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  color: "#a7f3d0",
                  textDecoration: "none",
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
                  style={{ marginRight: "2px" }}
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Open Web App
              </a>
            )}
          </div>

          <div className="details-grid">
            <div>
              <h4>Project folder</h4>
              <p>{project.folderPath}</p>
            </div>
            <div>
              <h4>Detected tags</h4>
              <div className="tags-row">
                {project.tags.map((tag) => (
                  <span key={tag} className="badge">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="details-grid">
            <div>
              <h4>npm scripts</h4>
              {renderScriptList(project.scripts)}
            </div>
            <div>
              <h4>Preview status</h4>
              <p>
                {project.previewPath
                  ? `Built static preview found at ${project.previewPath}.`
                  : "No static preview available yet."}
              </p>
            </div>
          </div>
        </article>

        <PreviewPane
          projectId={project.id}
          folderPath={project.folderPath}
          initialPreviewPath={project.previewPath}
          hasPackageJson={project.scripts.length > 0 || project.tags.includes("React") || project.tags.includes("Vite")}
        />
      </section>
    </main>
  );
}
