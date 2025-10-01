"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Loader2, Sparkles, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteCardAction,
  updateCardAction,
} from "@/app/(authenticated)/boards/[boardId]/actions";
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
import type { CardRow } from "@/lib/database.types";

const initialState = {
  success: undefined as string | undefined,
  error: undefined as string | undefined,
};

type Props = {
  boardId: string;
  columnId: string;
  card: CardRow;
};

type AiAction = "generate" | "summarize" | "suggest";

export function KanbanCard({ boardId, columnId, card }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [titleValue, setTitleValue] = useState(card.title);
  const [contentValue, setContentValue] = useState(card.content ?? "");
  const [aiPendingAction, startAi] = useTransition();
  const [state, formAction, isSaving] = useActionState(
    updateCardAction.bind(null, boardId),
    initialState,
  );
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success);
      setIsOpen(false);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  useEffect(() => {
    if (!isOpen) {
      setTitleValue(card.title);
      setContentValue(card.content ?? "");
    }
  }, [card, isOpen]);

  async function handleAi(action: AiAction) {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          title: titleValue,
          content: contentValue,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Permintaan AI gagal");
      }

      const result: string = data.result ?? "";
      if (action === "generate" || action === "summarize") {
        setContentValue(result.trim());
      } else if (action === "suggest") {
        setContentValue((prev) =>
          prev ? `${prev}\n\nSaran Tugas:\n${result.trim()}` : result.trim()
        );
      }
      toast.success("Hasil AI berhasil ditambahkan");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Gagal memproses permintaan AI"
      );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-full rounded-md border border-transparent bg-neutral-100 px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-neutral-100/60 dark:bg-neutral-800">
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
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit kartu</DialogTitle>
          <DialogDescription>
            Perbarui judul, deskripsi, atau gunakan bantuan AI untuk menulis konten.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="cardId" value={card.id} />
          <input type="hidden" name="columnId" value={columnId} />
          <Input
            name="title"
            value={titleValue}
            onChange={(event) => setTitleValue(event.target.value)}
            required
          />
          <Textarea
            name="content"
            value={contentValue}
            onChange={(event) => setContentValue(event.target.value)}
            rows={6}
            placeholder="Deskripsikan detail tugas"
          />

          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Asisten AI
              </div>
              {aiPendingAction && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Gunakan AI untuk mempercepat penulisan deskripsi atau menyusun langkah kerja.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={aiPendingAction}
                onClick={() => startAi(() => handleAi("generate"))}
              >
                Buat deskripsi
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={aiPendingAction || !contentValue}
                onClick={() => startAi(() => handleAi("summarize"))}
              >
                Ringkas konten
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={aiPendingAction}
                onClick={() => startAi(() => handleAi("suggest"))}
              >
                Saran tugas
              </Button>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() =>
                startDelete(async () => {
                  const result = await deleteCardAction(boardId, card.id);
                  if (result?.error) {
                    toast.error(result.error);
                  } else if (result?.success) {
                    toast.success(result.success);
                    setIsOpen(false);
                  }
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
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
