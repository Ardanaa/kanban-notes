"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { toast } from "sonner";

import {
  moveCardAction,
  reorderCardsAction,
  reorderColumnsAction,
} from "@/app/(authenticated)/boards/[boardId]/actions";
import type { BoardWithColumns, CardRow, ColumnWithCards } from "@/lib/database.types";

import { AddColumnCard } from "./new-column-card";
import { KanbanColumn } from "./kanban-column";
import { ActiveDrag, KanbanDragOverlay } from "./kanban-drag-overlay";

type SortableData = {
  type?: string;
  columnId?: string;
  card?: CardRow;
};

type Props = {
  board: BoardWithColumns;
};

export function KanbanBoard({ board }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const [columns, setColumns] = useState<ColumnWithCards[]>(() =>
    cloneColumns(board.columns)
  );
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setColumns(cloneColumns(board.columns));
  }, [board.columns]);

  const columnIds = useMemo(() => columns.map((column) => column.id), [columns]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const data = active.data.current as SortableData | undefined;

    if (data?.type === "column" && data.columnId) {
      const column = columns.find((col) => col.id === data.columnId);
      if (column) {
        setActiveDrag({ type: "column", column });
      }
      return;
    }

    if (data?.type === "card" && data.card && data.columnId) {
      setActiveDrag({ type: "card", card: data.card, columnId: data.columnId });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDrag(null);

    if (!over) {
      return;
    }

    const activeData = active.data.current as SortableData | undefined;
    const overData = over.data.current as SortableData | undefined;

    if (activeData?.type === "column" && activeData.columnId) {
      const activeId = activeData.columnId;
      const overId = overData?.columnId ?? (over.id as string);

      if (!overId || activeId === overId) {
        return;
      }

      const currentIndex = columns.findIndex((col) => col.id === activeId);
      const newIndex = columns.findIndex((col) => col.id === overId);

      if (currentIndex === -1 || newIndex === -1) {
        return;
      }

      const nextColumns = arrayMove(columns, currentIndex, newIndex);
      setColumns(nextColumns);
      persistColumnOrder(nextColumns.map((col) => col.id));
      return;
    }

    if (activeData?.type === "card" && activeData.card) {
      const activeCardId = activeData.card.id;
      const sourceColumnId = activeData.columnId!;
      const targetColumnId =
        overData?.columnId ?? (typeof over.id === "string" ? over.id : String(over.id));

      const updated = moveCardLocally(
        columns,
        activeCardId,
        sourceColumnId,
        targetColumnId,
        overData,
      );

      if (updated === columns) {
        return;
      }

      setColumns(updated);
      persistCardMovement(activeCardId, sourceColumnId, targetColumnId, updated);
    }
  }

  function moveCardLocally(
    cols: ColumnWithCards[],
    cardId: string,
    sourceColumnId: string,
    targetColumnId: string,
    overData?: SortableData,
  ) {
    const next = cols.map((column) => ({
      ...column,
      cards: (column.cards ?? []).map((card) => ({ ...card })),
    }));

    const sourceColumn = next.find((column) => column.id === sourceColumnId);
    const targetColumn = next.find((column) => column.id === targetColumnId);

    if (!sourceColumn || !targetColumn) {
      return cols;
    }

    const cardIndex = sourceColumn.cards.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) {
      return cols;
    }

    const [card] = sourceColumn.cards.splice(cardIndex, 1);
    const overCardId = overData?.type === "card" ? overData.card?.id : undefined;

    const updatedCard = { ...card, column_id: targetColumnId };

    if (!overCardId) {
      targetColumn.cards.push(updatedCard);
    } else {
      const targetIndex = targetColumn.cards.findIndex((c) => c.id === overCardId);
      if (targetIndex === -1) {
        targetColumn.cards.push(updatedCard);
      } else {
        targetColumn.cards.splice(targetIndex, 0, updatedCard);
      }
    }

    return next;
  }

  function persistColumnOrder(order: string[]) {
    startTransition(() => {
      reorderColumnsAction(board.id, order).catch((error) => {
        console.error(error);
        toast.error("Gagal menyimpan urutan kolom");
      });
    });
  }

  function persistCardMovement(
    cardId: string,
    sourceColumnId: string,
    targetColumnId: string,
    updatedColumns: ColumnWithCards[],
  ) {
    const targetColumn = updatedColumns.find((column) => column.id === targetColumnId);
    if (!targetColumn) {
      return;
    }
    const orderedIds = targetColumn.cards.map((card) => card.id);

    startTransition(() => {
      if (sourceColumnId === targetColumnId) {
        reorderCardsAction(board.id, targetColumnId, orderedIds).catch((error) => {
          console.error(error);
          toast.error("Gagal menyimpan urutan kartu");
        });
      } else {
        moveCardAction({
          boardId: board.id,
          cardId,
          targetColumnId,
          orderedCardIds: orderedIds,
        }).catch((error) => {
          console.error(error);
          toast.error("Gagal memindahkan kartu");
        });
      }
    });
  }
  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-2">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              boardId={board.id}
              column={column}
              isPending={isPending}
            />
          ))}
        </SortableContext>
        <AddColumnCard boardId={board.id} />
        <DragOverlay>
          <KanbanDragOverlay activeDrag={activeDrag} />
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function cloneColumns(columns: ColumnWithCards[]): ColumnWithCards[] {
  return columns.map((column) => ({
    ...column,
    cards: (column.cards ?? []).map((card) => ({ ...card })),
  }));
}



