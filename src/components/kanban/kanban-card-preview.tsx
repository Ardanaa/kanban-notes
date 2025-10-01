"use client";

import clsx from "clsx";
import { StickyNote } from "lucide-react";

import type { CardRow } from "@/lib/database.types";

type Props = {
  card: CardRow;
  className?: string;
};

export function KanbanCardPreview({ card, className }: Props) {
  return (
    <div
      className={clsx(
        "rounded-md border border-transparent bg-neutral-100 px-3 py-2 text-left text-sm dark:bg-neutral-800",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <StickyNote className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm">{card.title}</span>
          {card.content ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {card.content}
            </p>
          ) : (
            <p className="text-xs italic text-muted-foreground">Tidak ada deskripsi</p>
          )}
        </div>
      </div>
    </div>
  );
}

