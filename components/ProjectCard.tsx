import type { ProjectInfo } from "@/lib/projects";
import { PreviewPane } from "./PreviewPane";
import Link from "next/link";

export function ProjectCard({ project }: { project: ProjectInfo }) {
  const runScript = project.scripts.includes("dev") ? "dev" : project.scripts.includes("start") ? "start" : null;

  return (
    <article className="card">
      <header className="card-head">
        <div className="card-title-row">
          <h3 className="card-title">{project.folder}</h3>
          <Link href={`/projects/${project.id}`} className="card-link">
            Details →
          </Link>
        </div>
        <div className="card-meta">
          {project.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
          {runScript && <span className="tag tag-mono">npm run {runScript}</span>}
        </div>
      </header>

      <PreviewPane
        projectId={project.id}
        folderPath={project.folderPath}
        initialPreviewPath={project.previewPath}
        canLaunch={runScript !== null}
        scripts={project.scripts}
        height="340px"
      />
    </article>
  );
}
