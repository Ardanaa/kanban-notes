"use client";

import type { CardRow, ColumnWithCards } from "@/lib/database.types";

import { KanbanCardPreview } from "./kanban-card-preview";

export type ActiveDrag =
  | { type: "column"; column: ColumnWithCards }
  | { type: "card"; card: CardRow; columnId: string }
  | null;

type Props = {
  activeDrag: ActiveDrag;
};

export function KanbanDragOverlay({ activeDrag }: Props) {
  if (!activeDrag) return null;

  if (activeDrag.type === "column") {
    const column = activeDrag.column;
    return (
      <div className="w-[280px] rounded-lg bg-white p-3 shadow-xl dark:bg-neutral-900">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium leading-none">{column.name}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {(column.cards ?? []).length}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {(column.cards ?? []).slice(0, 3).map((card) => (
            <KanbanCardPreview key={card.id} card={card} />
          ))}
          {(column.cards ?? []).length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{(column.cards ?? []).length - 3} kartu lainnya
            </p>
          )}
        </div>
      </div>
    );
  }

  if (activeDrag.type === "card") {
    return <KanbanCardPreview card={activeDrag.card} className="shadow-xl" />;
  }

  return null;
}

