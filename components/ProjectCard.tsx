import type { ProjectInfo } from "@/lib/projects";
import { PreviewPane } from "./PreviewPane";

export function ProjectCard({ project }: { project: ProjectInfo }) {
  return (
    <article className="card" style={{ display: "flex", flexDirection: "column" }}>
      <div className="card-header" style={{ marginBottom: "0.75rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.35rem" }}>{project.name}</h3>
          <p className="project-copy" style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#94a3b8" }}>
            {project.description}
          </p>
        </div>
      </div>

      <ul className="meta-list" style={{ display: "flex", gap: "1rem", listStyle: "none", padding: 0, margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#94a3b8" }}>
        <li>
          Folder:{" "}
          <a
            href={`/preview/${project.id}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#60a5fa", textDecoration: "none", fontWeight: "600" }}
            title="Launch preview in a new tab"
          >
            {project.folder} ↗
          </a>
        </li>
        <li>Status: {project.status}</li>
      </ul>
      
      <div className="tags-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {project.tags.map((tag) => (
          <span key={tag} className="badge" style={{ padding: "0.25rem 0.5rem", borderRadius: "999px", background: "rgba(148, 163, 184, 0.12)", fontSize: "0.75rem", color: "#cbd5e1" }}>
            {tag}
          </span>
        ))}
      </div>

      <div style={{ marginTop: "auto", borderTop: "1px solid rgba(148, 163, 184, 0.1)", paddingTop: "1rem" }}>
        <PreviewPane
          projectId={project.id}
          folderPath={project.folderPath}
          initialPreviewPath={project.previewPath}
          hasPackageJson={project.scripts.length > 0 || project.tags.includes("React") || project.tags.includes("Vite")}
          height="380px"
        />
      </div>
    </article>
  );
}

