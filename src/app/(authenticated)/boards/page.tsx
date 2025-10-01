import { Suspense } from "react";

import { listBoards } from "@/server/board-service";
import { SupabaseAuthConfigurationError } from "@/lib/supabase";
import { SupabaseConfigAlert } from "@/components/dashboard/supabase-config-alert";
import { CreateBoardDialog } from "@/components/dashboard/create-board-dialog";
import { BoardsGrid } from "@/components/dashboard/boards-grid";

async function BoardsLoader() {
  try {
    const boards = await listBoards();
    return <BoardsGrid boards={boards} />;
  } catch (error) {
    if (error instanceof SupabaseAuthConfigurationError) {
      return <SupabaseConfigAlert />;
    }
    throw error;
  }
}

export default function BoardsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Semua Board</h1>
          <p className="text-muted-foreground">
            Tinjau dan kelola seluruh board Kanban Anda dari satu tempat.
          </p>
        </div>
        <CreateBoardDialog />
      </header>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Memuat board...</div>}>
        {/* @ts-expect-error Server Component */}
        <BoardsLoader />
      </Suspense>
    </div>
  );
}
