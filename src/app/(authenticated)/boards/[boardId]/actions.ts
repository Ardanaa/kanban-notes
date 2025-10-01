"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createCard,
  createColumn,
  deleteCard,
  deleteColumn,
  moveCard,
  reorderCards,
  reorderColumns,
  updateCard,
  updateColumn,
} from "@/server/board-service";

const columnSchema = z.object({
  name: z.string().min(1, "Nama kolom wajib diisi"),
});

const cardSchema = z.object({
  title: z.string().min(1, "Judul kartu wajib diisi"),
  content: z.string().optional(),
});

const success = (message: string) => ({ success: message });
const failure = (message: string) => ({ error: message });

type ActionState = {
  success?: string;
  error?: string;
};

export async function createColumnAction(
  boardId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = columnSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Data tidak valid");
  }

  try {
    await createColumn(boardId, { name: parsed.data.name });
    return success("Kolom berhasil dibuat");
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Gagal membuat kolom"
    );
  }
}

export async function updateColumnAction(
  boardId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = columnSchema
    .extend({ columnId: z.string().min(1) })
    .safeParse({
      name: formData.get("name"),
      columnId: formData.get("columnId"),
    });

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Data tidak valid");
  }

  try {
    await updateColumn(boardId, parsed.data.columnId, { name: parsed.data.name });
    return success("Kolom diperbarui");
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Gagal memperbarui kolom"
    );
  }
}

export async function deleteColumnAction(
  boardId: string,
  columnId: string
): Promise<ActionState> {
  try {
    await deleteColumn(boardId, columnId);
    return success("Kolom dihapus");
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Gagal menghapus kolom"
    );
  }
}

export async function createCardAction(
  boardId: string,
  columnId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = cardSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content") ?? undefined,
  });

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Data tidak valid");
  }

  try {
    await createCard(boardId, columnId, parsed.data);
    return success("Kartu berhasil dibuat");
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Gagal membuat kartu"
    );
  }
}

export async function updateCardAction(
  boardId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const schema = cardSchema.extend({
    cardId: z.string().min(1),
    columnId: z.string().min(1),
  });

  const parsed = schema.safeParse({
    cardId: formData.get("cardId"),
    columnId: formData.get("columnId"),
    title: formData.get("title"),
    content: formData.get("content") ?? undefined,
  });

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Data tidak valid");
  }

  try {
    await updateCard(boardId, parsed.data.cardId, {
      title: parsed.data.title,
      content: parsed.data.content,
      column_id: parsed.data.columnId,
    });
    return success("Kartu diperbarui");
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Gagal memperbarui kartu"
    );
  }
}

export async function deleteCardAction(
  boardId: string,
  cardId: string
): Promise<ActionState> {
  try {
    await deleteCard(boardId, cardId);
    return success("Kartu dihapus");
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Gagal menghapus kartu"
    );
  }
}

export async function reorderColumnsAction(
  boardId: string,
  columnIds: string[]
): Promise<void> {
  await reorderColumns(boardId, columnIds);
  revalidatePath(`/boards/${boardId}`);
}

export async function reorderCardsAction(
  boardId: string,
  columnId: string,
  cardIds: string[]
): Promise<void> {
  await reorderCards(boardId, columnId, cardIds);
  revalidatePath(`/boards/${boardId}`);
}

export async function moveCardAction(params: {
  boardId: string;
  cardId: string;
  targetColumnId: string;
  orderedCardIds: string[];
}): Promise<void> {
  await moveCard({
    boardId: params.boardId,
    cardId: params.cardId,
    targetColumnId: params.targetColumnId,
    targetOrder: params.orderedCardIds,
  });
  revalidatePath(`/boards/${params.boardId}`);
}

