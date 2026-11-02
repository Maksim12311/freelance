import { PublicShell } from "@/components/layout/public-shell";
import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/shared/loading-skeleton";

export default function Loading() {
  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <PageHeaderSkeleton />
        <CardGridSkeleton />
      </div>
    </PublicShell>
  );
}
