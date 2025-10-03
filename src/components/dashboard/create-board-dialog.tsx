"use client";

import { useActionState, useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { createBoardAction } from "@/app/(authenticated)/dashboard/actions";
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

const initialState = {
  error: undefined as string | undefined,
  success: undefined as string | undefined,
};

export function CreateBoardDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createBoardAction,
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
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Board Baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Board</DialogTitle>
          <DialogDescription>
            Atur nama dan deskripsi singkat untuk board proyek baru.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="board-name">Nama</Label>
            <Input
              id="board-name"
              name="name"
              placeholder="Contoh: Peluncuran Produk"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="board-description">Deskripsi</Label>
            <Textarea
              id="board-description"
              name="description"
              placeholder="Opsional: tambahan konteks atau tujuan proyek"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Membuat..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
