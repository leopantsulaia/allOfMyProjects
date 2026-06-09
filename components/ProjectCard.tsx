import Link from "next/link";
import type { ProjectInfo } from "@/lib/projects";

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
      
      <div className="tags-row">
        {project.tags.map((tag) => (
          <span key={tag} className="badge">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

