import { PageSkeleton } from "@/components/ui/page-skeleton"

export default function Loading() {
  return (
    <div className="container-summit py-10">
      <PageSkeleton label="The SOVEREIGN Summit" />
    </div>
  )
}
