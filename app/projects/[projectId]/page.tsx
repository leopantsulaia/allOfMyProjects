import { notFound } from "next/navigation";
import { getProjectList } from "@/lib/projects";
import { PreviewPane } from "@/components/PreviewPane";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const projects = await getProjectList();
  const project = projects.find((item) => item.id === params.projectId);
  if (!project) notFound();

  return (
    <main className="page-shell">
      <Link href="/" className="back-link">← All projects</Link>

      <header className="top">
        <div>
          <h1>{project.folder}<span>.</span></h1>
          <p>{project.description}</p>
        </div>
      </header>

      <div className="info-grid">
        <div><h4>Folder</h4><p>{project.folderPath}</p></div>
        <div><h4>Stack</h4><p>{project.tags.join(" · ") || "—"}</p></div>
        <div><h4>Scripts</h4><p>{project.scripts.join(", ") || "none"}</p></div>
        <div><h4>Existing build</h4><p>{project.previewPath || "none"}</p></div>
      </div>

      <PreviewPane
        projectId={project.id}
        folderPath={project.folderPath}
        initialPreviewPath={project.previewPath}
        canLaunch={project.scripts.includes("dev") || project.scripts.includes("start")}
        scripts={project.scripts}
        height="70vh"
      />
    </main>
  );
}
