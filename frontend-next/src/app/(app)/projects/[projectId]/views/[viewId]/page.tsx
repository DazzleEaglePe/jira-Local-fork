"use client"

import { useParams } from "next/navigation"

import { ProjectViewScreen } from "@/components/projects/project-view-screen"

export default function ProjectViewPage() {
  const { projectId, viewId } = useParams<{ projectId: string; viewId: string }>()
  return <ProjectViewScreen projectId={Number(projectId)} viewId={Number(viewId)} />
}
