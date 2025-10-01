"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";

import {
  deleteColumnAction,
  updateColumnAction,
} from "@/app/(authenticated)/boards/[boardId]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ColumnWithCards } from "@/lib/database.types";

import { AddCardDialog } from "./new-card-dialog";
import { SortableCard } from "./sortable-card";

type Props = {
  boardId: string;
  column: ColumnWithCards;
  isPending: boolean;
};

const initialState = {
  success: undefined as string | undefined,
  error: undefined as string | undefined,
};

export function KanbanColumn({ boardId, column, isPending }: Props) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [state, formAction, isSaving] = useActionState(
    updateColumnAction.bind(null, boardId),
    initialState,
  );
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setIsEditOpen(false);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

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
    data: { type: "column", columnId: column.id },
  });

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
            {(column.cards ?? []).length}
          </span>
        </div>
        <ColumnMenu
          columnName={column.name}
          onEdit={() => setIsEditOpen(true)}
          onDelete={() =>
            startDelete(async () => {
              const result = await deleteColumnAction(boardId, column.id);
              if (result?.error) {
                toast.error(result.error);
              } else if (result?.success) {
                toast.success(result.success);
              }
            })
          }
          isDeleting={isDeleting}
        />
      </header>

      <SortableContext
        items={(column.cards ?? []).map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {(column.cards ?? []).map((card) => (
            <SortableCard
              key={card.id}
              boardId={boardId}
              columnId={column.id}
              card={card}
            />
          ))}
        </div>
      </SortableContext>

      <AddCardDialog boardId={boardId} columnId={column.id} disabled={isPending} />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit kolom</DialogTitle>
            <DialogDescription>
              Ganti nama kolom agar mencerminkan alur kerja Anda.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="columnId" value={column.id} />
            <Input name="name" defaultValue={column.name} required />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ColumnMenu({
  columnName,
  onEdit,
  onDelete,
  isDeleting,
}: {
  columnName: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [isAlertOpen, setAlertOpen] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Aksi kolom">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit} className="flex items-center gap-2">
          <Pencil className="h-4 w-4" /> Edit kolom
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setAlertOpen(true)} className="flex items-center gap-2 text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4" /> Hapus kolom
        </DropdownMenuItem>
      </DropdownMenuContent>
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kolom?</AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh kartu dalam kolom &quot;{columnName}&quot; juga akan terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
}
