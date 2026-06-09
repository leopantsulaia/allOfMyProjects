import { ProjectCard } from "./ProjectCard";
import type { ProjectInfo } from "@/lib/projects";

export function ProjectGrid({ projects }: { projects: ProjectInfo[] }) {
  if (projects.length === 0) {
    return (
      <div className="card">
        <h3>No projects discovered yet</h3>
        <p>
          Add local projects next to `allOfMyProjects` and refresh the page. The
          site will automatically detect folders with `package.json`, `src`,
          `app`, or `public`.
        </p>
      </div>
    );
  }

  return (
    <div className="grid">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
