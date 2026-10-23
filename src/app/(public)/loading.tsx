import { PageSkeleton } from "@/components/ui/page-skeleton"

export default function Loading() {
  return (
    <div className="container-summit py-10">
      <PageSkeleton label="Opening this page" />
    </div>
  )
}
