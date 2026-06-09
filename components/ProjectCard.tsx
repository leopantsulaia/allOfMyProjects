import Link from "next/link";
import type { ProjectInfo } from "@/lib/projects";
import { LaunchControls } from "./LaunchControls";

export function ProjectCard({ project }: { project: ProjectInfo }) {
  return (
    <article className="card">
      <div className="card-header">
        <div>
          <h3>{project.name}</h3>
          <p className="project-copy">{project.description}</p>
        </div>
        <Link className="project-link" href={`/projects/${project.id}`}>
          Details
        </Link>
      </div>

      <ul className="meta-list">
        <li>Folder: {project.folder}</li>
        <li>Status: {project.status}</li>
      </ul>
      
      <div className="tags-row" style={{ marginBottom: "1.25rem" }}>
        {project.tags.map((tag) => (
          <span key={tag} className="badge">
            {tag}
          </span>
        ))}
      </div>

      <div style={{ marginTop: "auto", borderTop: "1px solid rgba(148, 163, 184, 0.1)", paddingTop: "1rem" }}>
        <LaunchControls folderPath={project.folderPath} />
      </div>
    </article>
  );
}

