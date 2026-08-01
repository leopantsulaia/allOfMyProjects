import { getProjectList } from "@/lib/projects";
import { ProjectGrid } from "@/components/ProjectGrid";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getProjectList();

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">All Of My Projects Hub</p>
          <h1>One place for every local project</h1>
          <p>
            Browse each app like a website and open project details from a
            single portal. Click any card to explore the app and launch it.
          </p>
        </div>
      </section>

      <section className="content-block">
        <div className="section-header">
          <div>
            <p className="eyebrow">Discovered projects</p>
            <h2>Projects found in the workspace</h2>
          </div>
          <span className="tag status-pill">{projects.length} projects</span>
        </div>
        <ProjectGrid projects={projects} />
      </section>
    </main>
  );
}
