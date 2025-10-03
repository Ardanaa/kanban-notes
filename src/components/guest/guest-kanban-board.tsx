"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Pencil, PlusCircle, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { GuestBoard, GuestCard, GuestColumn } from "@/lib/guest/types";

type SortableData = {
  type: "column" | "card";
  columnId?: string;
  card?: GuestCard;
};

export type GuestBoardHandlers = {
  onCreateColumn: (boardId: string, payload: { name: string }) => void;
  onUpdateColumn: (boardId: string, columnId: string, payload: { name: string }) => void;
  onDeleteColumn: (boardId: string, columnId: string) => void;
  onCreateCard: (
    boardId: string,
    columnId: string,
    payload: { title: string; content: string | null },
  ) => void;
  onUpdateCard: (
    boardId: string,
    columnId: string,
    cardId: string,
    payload: { title: string; content: string | null },
  ) => void;
  onDeleteCard: (boardId: string, columnId: string, cardId: string) => void;
  onReorderColumns: (boardId: string, columnIds: string[]) => void;
  onReorderCards: (boardId: string, columnId: string, cardIds: string[]) => void;
  onMoveCard: (
    boardId: string,
    cardId: string,
    sourceColumnId: string,
    targetColumnId: string,
    orderedCardIds: string[],
  ) => void;
};

type Props = {
  board: GuestBoard;
  handlers: GuestBoardHandlers;
};

type ActiveDrag =
  | { type: "column"; column: GuestColumn }
  | { type: "card"; card: GuestCard; columnId: string }
  | null;

export function GuestKanbanBoard({ board, handlers }: Props) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const [columns, setColumns] = useState<GuestColumn[]>(() => cloneColumns(board.columns));
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
      startTransition(() => handlers.onReorderColumns(board.id, nextColumns.map((col) => col.id)));
      return;
    }

    if (activeData?.type === "card" && activeData.card && activeData.columnId) {
      const activeCardId = activeData.card.id;
      const sourceColumnId = activeData.columnId;
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

      startTransition(() => {
        if (sourceColumnId === targetColumnId) {
          handlers.onReorderCards(board.id, targetColumnId, orderedIds(updated, targetColumnId));
        } else {
          handlers.onMoveCard(
            board.id,
            activeCardId,
            sourceColumnId,
            targetColumnId,
            orderedIds(updated, targetColumnId),
          );
        }
      });
    }
  }

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-2">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {columns.map((column) => (
            <GuestKanbanColumn
              key={column.id}
              boardId={board.id}
              column={column}
              isPending={isPending}
              handlers={handlers}
            />
          ))}
        </SortableContext>
        <AddColumnCard boardId={board.id} handlers={handlers} />
        <DragOverlay>
          {activeDrag?.type === "column" ? (
            <ColumnOverlay column={activeDrag.column} />
          ) : activeDrag?.type === "card" ? (
            <CardOverlay card={activeDrag.card} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function ColumnOverlay({ column }: { column: GuestColumn }) {
  return (
    <div className="w-[280px] rounded-lg bg-white p-3 shadow-xl dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium leading-none">{column.name}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {column.cards.length}
        </span>
      </div>
    </div>
  );
}

function CardOverlay({ card }: { card: GuestCard }) {
  return (
    <div className="w-[240px] rounded-md border border-transparent bg-neutral-100 px-3 py-2 text-left text-sm shadow-xl dark:bg-neutral-800">
      <div className="flex items-start gap-2">
        <StickyNote className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm">{card.title}</span>
          {card.content ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{card.content}</p>
          ) : (
            <p className="text-xs italic text-muted-foreground">Tidak ada deskripsi</p>
          )}
        </div>
      </div>
    </div>
  );
}

function GuestKanbanColumn({
  boardId,
  column,
  isPending,
  handlers,
}: {
  boardId: string;
  column: GuestColumn;
  isPending: boolean;
  handlers: GuestBoardHandlers;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [isDeleting, startDelete] = useTransition();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", columnId: column.id } satisfies SortableData,
  });

  useEffect(() => {
    setEditName(column.name);
  }, [column.name]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex w-[280px] shrink-0 flex-col gap-3 rounded-lg bg-white p-3 shadow-sm dark:bg-neutral-900"
    >
      <header className="flex items-center justify-between gap-2">
        <div
          className="flex items-center gap-2"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
        >
          <span className="font-medium leading-none">{column.name}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {column.cards.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Aksi kolom">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setIsEditOpen(true)} className="flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Edit kolom
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                if (isDeleting) {
                  return;
                }

                startDelete(() => {
                  handlers.onDeleteColumn(boardId, column.id);
                  toast.success("Kolom dihapus");
                });
              }}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Hapus kolom
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <SortableContext items={column.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {column.cards.map((card) => (
            <GuestSortableCard
              key={card.id}
              boardId={boardId}
              columnId={column.id}
              card={card}
              handlers={handlers}
            />
          ))}
        </div>
      </SortableContext>

      <AddCardDialog boardId={boardId} columnId={column.id} handlers={handlers} disabled={isPending} />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit kolom</DialogTitle>
            <DialogDescription>
              Ganti nama kolom agar mencerminkan alur kerja Anda.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const value = editName.trim();
              if (!value) {
                toast.error("Nama kolom wajib diisi");
                return;
              }
              handlers.onUpdateColumn(boardId, column.id, { name: value });
              toast.success("Kolom diperbarui");
              setIsEditOpen(false);
            }}
          >
            <Input value={editName} onChange={(event) => setEditName(event.target.value)} required />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GuestSortableCard({
  boardId,
  columnId,
  card,
  handlers,
}: {
  boardId: string;
  columnId: string;
  card: GuestCard;
  handlers: GuestBoardHandlers;
}) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: card.id,
    data: { type: "card", columnId, card } satisfies SortableData,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <GuestKanbanCard boardId={boardId} columnId={columnId} card={card} handlers={handlers} />
    </div>
  );
}

function GuestKanbanCard({
  boardId,
  columnId,
  card,
  handlers,
}: {
  boardId: string;
  columnId: string;
  card: GuestCard;
  handlers: GuestBoardHandlers;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [titleValue, setTitleValue] = useState(card.title);
  const [contentValue, setContentValue] = useState(card.content ?? "");
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (!isOpen) {
      setTitleValue(card.title);
      setContentValue(card.content ?? "");
    }
  }, [card, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-full rounded-md border border-transparent bg-neutral-100 px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-neutral-100/60 dark:bg-neutral-800">
          <div className="flex items-start gap-2">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <span className="font-medium text-sm">{card.title}</span>
              {card.content ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">{card.content}</p>
              ) : (
                <p className="text-xs italic text-muted-foreground">Tidak ada deskripsi</p>
              )}
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit kartu</DialogTitle>
          <DialogDescription>
            Perbarui judul atau deskripsi. Data mode tamu akan hilang setelah jendela ditutup.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const title = titleValue.trim();
            if (!title) {
              toast.error("Judul wajib diisi");
              return;
            }
            handlers.onUpdateCard(boardId, columnId, card.id, {
              title,
              content: contentValue.trim() ? contentValue : null,
            });
            toast.success("Kartu diperbarui");
            setIsOpen(false);
          }}
        >
          <Input value={titleValue} onChange={(event) => setTitleValue(event.target.value)} required />
          <Textarea
            value={contentValue}
            onChange={(event) => setContentValue(event.target.value)}
            rows={6}
            placeholder="Deskripsikan detail tugas"
          />
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() =>
                startDelete(() => {
                  handlers.onDeleteCard(boardId, columnId, card.id);
                  toast.success("Kartu dihapus");
                  setIsOpen(false);
                })
              }
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Hapus
                </span>
              )}
            </Button>
            <Button type="submit">Simpan perubahan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddColumnCard({ boardId, handlers }: { boardId: string; handlers: GuestBoardHandlers }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex h-full w-[280px] shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/30 p-3 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary">
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah kolom
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kolom baru</DialogTitle>
          <DialogDescription>Susun tahapan baru untuk board tamu Anda.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const value = name.trim();
            if (!value) {
              toast.error("Nama kolom wajib diisi");
              return;
            }

            startTransition(() => {
              handlers.onCreateColumn(boardId, { name: value });
              toast.success("Kolom ditambahkan");
              setName("");
              setIsOpen(false);
            });
          }}
        >
          <Input value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menambah..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddCardDialog({
  boardId,
  columnId,
  handlers,
  disabled,
}: {
  boardId: string;
  columnId: string;
  handlers: GuestBoardHandlers;
  disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="justify-start" disabled={disabled}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah kartu
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kartu baru</DialogTitle>
          <DialogDescription>Buat catatan atau tugas baru untuk kolom ini.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmedTitle = title.trim();
            if (!trimmedTitle) {
              toast.error("Judul wajib diisi");
              return;
            }

            startTransition(() => {
              handlers.onCreateCard(boardId, columnId, {
                title: trimmedTitle,
                content: content.trim() ? content : null,
              });
              toast.success("Kartu ditambahkan");
              setTitle("");
              setContent("");
              setIsOpen(false);
            });
          }}
        >
          <Input value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus />
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Deskripsi atau detail tambahan"
            rows={4}
          />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function moveCardLocally(
  cols: GuestColumn[],
  cardId: string,
  sourceColumnId: string,
  targetColumnId: string,
  overData?: SortableData,
) {
  const next = cols.map((column) => ({
    ...column,
    cards: column.cards.map((card) => ({ ...card })),
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

  if (!overCardId) {
    targetColumn.cards.push(card);
  } else {
    const targetIndex = targetColumn.cards.findIndex((c) => c.id === overCardId);
    if (targetIndex === -1) {
      targetColumn.cards.push(card);
    } else {
      targetColumn.cards.splice(targetIndex, 0, card);
    }
  }

  return next;
}

function orderedIds(columns: GuestColumn[], columnId: string) {
  const targetColumn = columns.find((column) => column.id === columnId);
  return targetColumn ? targetColumn.cards.map((card) => card.id) : [];
}

function cloneColumns(columns: GuestColumn[]): GuestColumn[] {
  return columns.map((column) => ({
    ...column,
    cards: column.cards.map((card) => ({ ...card })),
  }));
}



