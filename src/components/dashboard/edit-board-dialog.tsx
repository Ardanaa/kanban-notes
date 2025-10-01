"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateBoardAction } from "@/app/(authenticated)/dashboard/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BoardRow } from "@/lib/database.types";

const initialState = {
  error: undefined as string | undefined,
  success: undefined as string | undefined,
};

type Props = {
  board: BoardRow;
};

export function EditBoardDialog({ board }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateBoardAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setIsOpen(false);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Edit board">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Board</DialogTitle>
          <DialogDescription>
            Perbarui detail board sesuai kebutuhan tim Anda.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="boardId" value={board.id} />
          <div className="space-y-2">
            <Label htmlFor={`name-${board.id}`}>Nama</Label>
            <Input
              id={`name-${board.id}`}
              name="name"
              defaultValue={board.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`description-${board.id}`}>Deskripsi</Label>
            <Textarea
              id={`description-${board.id}`}
              name="description"
              defaultValue={board.description ?? ""}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
