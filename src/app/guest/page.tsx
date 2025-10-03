"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GuestKanbanBoard, GuestBoardHandlers } from "@/components/guest/guest-kanban-board";
import type { GuestBoard, GuestBoardsState, GuestCard } from "@/lib/guest/types";

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function createInitialBoard(): GuestBoard {
  const now = new Date().toISOString();
  return {
    id: createId(),
    name: "Board Tamu",
    description: "Tambahkan kolom dan kartu untuk mencoba fitur tanpa membuat akun.",
    createdAt: now,
    updatedAt: now,
    columns: [],
  };
}

function createInitialState(): GuestBoardsState {
  const board = createInitialBoard();
  return {
    boards: [board],
    activeBoardId: board.id,
  };
}

export default function GuestPage() {
  const [state, setState] = useState<GuestBoardsState>(() => createInitialState());

  const activeBoard = useMemo(() => {
    return state.boards.find((board) => board.id === state.activeBoardId) ?? state.boards[0] ?? null;
  }, [state.boards, state.activeBoardId]);

  const resetBoard = useCallback(() => {
    setState(createInitialState());
  }, []);

  const handlers: GuestBoardHandlers = useMemo(() => {
    const setBoardsState = (
      updater: (draft: GuestBoardsState) => GuestBoardsState,
    ) => {
      setState((prev) => updater(structuredClone(prev)));
    };

    const touchBoard = (
      boardsState: GuestBoardsState,
      boardId: string,
      mutate: (board: GuestBoard) => void,
    ) => {
      const board = boardsState.boards.find((item) => item.id === boardId);
      if (!board) {
        return;
      }
      mutate(board);
      board.updatedAt = new Date().toISOString();
    };

    return {
      onCreateColumn(boardId, payload) {
        setBoardsState((draft) => {
          touchBoard(draft, boardId, (board) => {
            board.columns.push({ id: createId(), name: payload.name, cards: [] });
          });
          return draft;
        });
      },
      onUpdateColumn(boardId, columnId, payload) {
        setBoardsState((draft) => {
          touchBoard(draft, boardId, (board) => {
            const column = board.columns.find((item) => item.id === columnId);
            if (column) {
              column.name = payload.name;
            }
          });
          return draft;
        });
      },
      onDeleteColumn(boardId, columnId) {
        setBoardsState((draft) => {
          touchBoard(draft, boardId, (board) => {
            board.columns = board.columns.filter((column) => column.id !== columnId);
          });
          return draft;
        });
      },
      onCreateCard(boardId, columnId, payload) {
        setBoardsState((draft) => {
          touchBoard(draft, boardId, (board) => {
            const column = board.columns.find((item) => item.id === columnId);
            if (column) {
              column.cards.push({
                id: createId(),
                title: payload.title,
                content: payload.content,
              });
            }
          });
          return draft;
        });
      },
      onUpdateCard(boardId, columnId, cardId, payload) {
        setBoardsState((draft) => {
          touchBoard(draft, boardId, (board) => {
            const column = board.columns.find((item) => item.id === columnId);
            const card = column?.cards.find((item) => item.id === cardId);
            if (card) {
              card.title = payload.title;
              card.content = payload.content;
            }
          });
          return draft;
        });
      },
      onDeleteCard(boardId, columnId, cardId) {
        setBoardsState((draft) => {
          touchBoard(draft, boardId, (board) => {
            const column = board.columns.find((item) => item.id === columnId);
            if (column) {
              column.cards = column.cards.filter((card) => card.id !== cardId);
            }
          });
          return draft;
        });
      },
      onReorderColumns(boardId, columnIds) {
        setBoardsState((draft) => {
          touchBoard(draft, boardId, (board) => {
            const map = new Map(board.columns.map((column) => [column.id, column] as const));
            const ordered = columnIds
              .map((id) => map.get(id))
              .filter((column): column is NonNullable<typeof column> => Boolean(column));
            const leftovers = board.columns.filter((column) => !map.has(column.id));
            board.columns = [...ordered, ...leftovers];
          });
          return draft;
        });
      },
      onReorderCards(boardId, columnId, cardIds) {
        setBoardsState((draft) => {
          touchBoard(draft, boardId, (board) => {
            const column = board.columns.find((item) => item.id === columnId);
            if (!column) {
              return;
            }
            const map = new Map(column.cards.map((card) => [card.id, card] as const));
            const ordered = cardIds
              .map((id) => map.get(id))
              .filter((card): card is NonNullable<typeof card> => Boolean(card));
            const leftovers = column.cards.filter((card) => !cardIds.includes(card.id));
            column.cards = [...ordered, ...leftovers];
          });
          return draft;
        });
      },
      onMoveCard(boardId, cardId, sourceColumnId, targetColumnId, orderedCardIds) {
        setBoardsState((draft) => {
          touchBoard(draft, boardId, (board) => {
            if (sourceColumnId === targetColumnId) {
              return;
            }

            let movingCard: GuestCard | null = null;

            const columnsWithoutCard = board.columns.map((column) => {
              if (column.id !== sourceColumnId) {
                return column;
              }
              const remaining = column.cards.filter((card) => {
                if (card.id === cardId) {
                  movingCard = card;
                  return false;
                }
                return true;
              });
              return { ...column, cards: remaining };
            });

            if (!movingCard) {
              return;
            }

            const cardToInsert = movingCard;

            board.columns = columnsWithoutCard.map((column) => {
              if (column.id !== targetColumnId) {
                return column;
              }

              const map = new Map(column.cards.map((card) => [card.id, card] as const));
              map.set(cardToInsert.id, cardToInsert);

              const ordered = orderedCardIds
                .map((id) => map.get(id))
                .filter((card): card is NonNullable<typeof card> => Boolean(card));
              const leftovers = column.cards.filter((card) => !orderedCardIds.includes(card.id));

              return { ...column, cards: [...ordered, ...leftovers] };
            });
          });
          return draft;
        });
      },
    } satisfies GuestBoardHandlers;
  }, []);

  if (!activeBoard) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-6 text-center dark:bg-neutral-950">
        <p className="text-lg font-semibold">Tidak ada board tamu yang tersedia.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Segarkan halaman atau mulai ulang untuk mencoba kembali.
        </p>
        <Button className="mt-4" onClick={resetBoard}>
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b bg-white/80 backdrop-blur dark:bg-neutral-900/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke beranda
              </Link>
            </Button>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Mode tamu (tidak tersimpan)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetBoard} className="gap-2">
              <RefreshCcw className="h-4 w-4" /> Reset board tamu
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-in">Masuk untuk menyimpan</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{activeBoard.name}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{activeBoard.description}</p>
        </div>
        <GuestKanbanBoard board={activeBoard} handlers={handlers} />
      </main>
    </div>
  );
}



