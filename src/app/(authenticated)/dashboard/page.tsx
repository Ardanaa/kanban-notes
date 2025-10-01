import { Suspense } from "react";

import { getDashboardSummary } from "@/server/board-service";
import { SupabaseAuthConfigurationError } from "@/lib/supabase";
import { SupabaseConfigAlert } from "@/components/dashboard/supabase-config-alert";
import { CreateBoardDialog } from "@/components/dashboard/create-board-dialog";
import { DashboardSummary, DashboardSummarySkeleton } from "@/components/dashboard/dashboard-summary";

async function SummaryLoader() {
  try {
    const summary = await getDashboardSummary();
    return <DashboardSummary summary={summary} />;
  } catch (error) {
    if (error instanceof SupabaseAuthConfigurationError) {
      return <SupabaseConfigAlert />;
    }
    throw error;
  }
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Kelola seluruh board proyek dan catatan Kanban Anda di satu tempat.
          </p>
        </div>
        <CreateBoardDialog />
      </header>
      <Suspense fallback={<DashboardSummarySkeleton />}>
        <SummaryLoader />
      </Suspense>

    </div>
  );
}
