import { CongratulationsView } from "@/features/product-design/ui/views/congratulations-view";
import { Suspense } from "react";

function CongratulationsLoading() {
  return (
    <div className="max-w-7xl mx-auto container px-4 py-12">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your success page...</p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<CongratulationsLoading />}>
      <CongratulationsView />
    </Suspense>
  );
}
