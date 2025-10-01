"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

import type { CardRow } from "@/lib/database.types";

import { KanbanCard } from "./kanban-card";

type Props = {
  boardId: string;
  columnId: string;
  card: CardRow;
};

export function SortableCard({ boardId, columnId, card }: Props) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: card.id,
    data: { type: "card", columnId, card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard boardId={boardId} columnId={columnId} card={card} />
    </div>
  );
}

