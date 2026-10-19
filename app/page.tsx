import { getProjectList } from "@/lib/projects";
import { ProjectGrid } from "@/components/ProjectGrid";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await getProjectList();
  const runnable = projects.filter((p) => p.scripts.includes("dev") || p.scripts.includes("start")).length;
  const built = projects.filter((p) => p.previewPath).length;

  return (
    <main className="page-shell">
      <header className="top">
        <div>
          <h1>All of my projects<span>.</span></h1>
          <p>Hit play on any project to run it on this machine. Missing dependencies get installed automatically.</p>
        </div>
        <div className="stats">
          <div className="stat"><strong>{projects.length}</strong><span>Projects</span></div>
          <div className="stat"><strong>{runnable}</strong><span>Runnable</span></div>
          <div className="stat"><strong>{built}</strong><span>Built</span></div>
        </div>
      </header>

      <ProjectGrid projects={projects} />
    </main>
  );
}
