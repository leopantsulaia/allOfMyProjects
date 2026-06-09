import { getProjectList } from "@/lib/projects";
import { ProjectGrid } from "@/components/ProjectGrid";

export default async function ProjectsPage() {
  const projects = await getProjectList();

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Project Directory</p>
          <h1>All local apps in one place</h1>
          <p>
            Browse every project and open its detail page to launch the app or
            review its instructions.
          </p>
        </div>
      </section>

      <section className="content-block">
        <div className="section-header">
          <div>
            <p className="eyebrow">Local applications</p>
            <h2>Available projects</h2>
          </div>
          <span className="tag status-pill">{projects.length} projects</span>
        </div>
        <ProjectGrid projects={projects} />
      </section>
    </main>
  );
}
