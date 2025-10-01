import { notFound } from "next/navigation";

import { SupabaseAuthConfigurationError } from "@/lib/supabase";
import { SupabaseConfigAlert } from "@/components/dashboard/supabase-config-alert";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import type { BoardWithColumns } from "@/lib/database.types";
import { getBoardWithRelations } from "@/server/board-service";

export default async function BoardPage({
  params,
}: {
  params: { boardId: string };
}) {
  try {
    const board = await getBoardWithRelations(params.boardId);

    if (!board) {
      notFound();
    }

    return <BoardView board={board} />;
  } catch (error) {
    if (error instanceof SupabaseAuthConfigurationError) {
      return <SupabaseConfigAlert />;
    }
    throw error;
  }
}

function BoardView({ board }: { board: BoardWithColumns }) {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{board.name}</h1>
        {board.description ? (
          <p className="text-muted-foreground max-w-3xl">{board.description}</p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Tambahkan deskripsi untuk memberikan konteks kepada tim.
          </p>
        )}
      </header>
      <KanbanBoard board={board} />
    </div>
  );
}
