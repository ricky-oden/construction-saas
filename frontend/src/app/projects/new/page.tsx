"use client";

import { useRouter } from "next/navigation";

import { ManagementRoute } from "@/auth/management-route";
import { ProjectForm } from "@/components/business/project-form";

export default function NewProjectPage() {
  const router = useRouter();
  return (
    <ManagementRoute>
      <main className="page-stack narrow-page">
        <section className="panel">
          <h1>案件登録</h1>
          <ProjectForm
            onSaved={(project) => router.push(`/projects/${project.id}`)}
          />
        </section>
      </main>
    </ManagementRoute>
  );
}
