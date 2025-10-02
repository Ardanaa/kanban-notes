"use client";

import Link from "next/link";
import { ArrowUpRight, LayoutGrid } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BoardRow } from "@/lib/database.types";

import { DeleteBoardButton } from "./delete-board-button";
import { EditBoardDialog } from "./edit-board-dialog";

type Props = {
  boards: BoardRow[];
  mode?: "default" | "guest";
};

function formatUpdatedAt(value: string | null | undefined): string {
  if (!value) {
    return "Tidak diketahui";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Tidak diketahui";
  }

  return parsed.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function BoardsGrid({ boards, mode = "default" }: Props) {
  if (!boards.length) {
    return (
      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-center gap-3">
          <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Belum ada board</CardTitle>
            <CardDescription>
              Gunakan tombol &quot;Board Baru&quot; untuk mulai menyusun proyek Anda.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {boards.map((board) => {
        const href = mode === "guest" ? `/guest/boards/${board.id}` : `/boards/${board.id}`;

        return (
          <Card key={board.id} className="h-full">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={href}
                  className="text-lg font-semibold leading-tight line-clamp-1 hover:underline"
                >
                  {board.name}
                </Link>
                {mode === "default" && (
                  <div className="flex items-center gap-1">
                    <EditBoardDialog board={board} />
                    <DeleteBoardButton boardId={board.id} boardName={board.name} />
                  </div>
                )}
              </div>
              {board.description ? (
                <CardDescription className="line-clamp-3">
                  {board.description}
                </CardDescription>
              ) : (
                <CardDescription className="italic text-muted-foreground">
                  Tidak ada deskripsi.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {board.updated_at ? "Diperbarui" : "Dibuat"} {formatUpdatedAt(board.updated_at ?? board.created_at)}
              </span>
              <Link
                href={href}
                className="inline-flex items-center gap-1 text-xs font-medium hover:text-primary"
              >
                Buka board
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

