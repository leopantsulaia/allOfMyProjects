import { redirect } from "next/navigation";

// The home page already lists every project.
export default function ProjectsPage() {
  redirect("/");
}
