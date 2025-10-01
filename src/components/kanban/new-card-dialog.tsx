"use client";

import { useActionState, useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { createCardAction } from "@/app/(authenticated)/boards/[boardId]/actions";
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
import { Textarea } from "@/components/ui/textarea";

const initialState = {
  success: undefined as string | undefined,
  error: undefined as string | undefined,
};

type Props = {
  boardId: string;
  columnId: string;
  disabled?: boolean;
};

export function AddCardDialog({ boardId, columnId, disabled }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createCardAction.bind(null, boardId, columnId),
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
        <Button variant="ghost" size="sm" className="justify-start" disabled={disabled}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah kartu
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kartu baru</DialogTitle>
          <DialogDescription>
            Buat catatan atau tugas baru untuk kolom ini.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <Input name="title" placeholder="Judul" required autoFocus />
          <Textarea
            name="content"
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
