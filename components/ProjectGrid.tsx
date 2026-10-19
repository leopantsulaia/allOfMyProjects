import { ProjectCard } from "./ProjectCard";
import type { ProjectInfo } from "@/lib/projects";

export function ProjectGrid({ projects }: { projects: ProjectInfo[] }) {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        No projects found next to <code>allOfMyProjects</code>. Add a folder with a package.json and refresh.
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
