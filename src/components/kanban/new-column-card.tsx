"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createColumnAction } from "@/app/(authenticated)/boards/[boardId]/actions";
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

const initialState = {
  success: undefined as string | undefined,
  error: undefined as string | undefined,
};

type Props = {
  boardId: string;
};

export function AddColumnCard({ boardId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createColumnAction.bind(null, boardId),
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
        <button className="flex h-full min-h-[220px] w-[280px] items-center justify-center rounded-lg border border-dashed border-muted bg-muted/30 p-4 text-sm text-muted-foreground transition hover:border-primary hover:text-primary">
          <Plus className="mr-2 h-4 w-4" /> Tambah kolom
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kolom baru</DialogTitle>
          <DialogDescription>
            Kolom membantu Anda mengelompokkan kartu berdasarkan tahap pekerjaan.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <Input
            name="name"
            placeholder="Contoh: To Do"
            required
            autoFocus
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
