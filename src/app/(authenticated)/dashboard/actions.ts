"use server";

import { z } from "zod";

import {
  createBoard,
  deleteBoard,
  updateBoard,
} from "@/server/board-service";

type ActionState = {
  error?: string;
  success?: string;
};

const boardSchema = z.object({
  name: z.string().min(1, "Nama board wajib diisi"),
  description: z.string().optional(),
});

export async function createBoardAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = boardSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  try {
    await createBoard(parsed.data);
    return { success: "Board berhasil dibuat" };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Gagal membuat board, coba lagi",
    };
  }
}

const updateBoardSchema = boardSchema.extend({
  boardId: z.string().min(1),
});

export async function updateBoardAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateBoardSchema.safeParse({
    boardId: formData.get("boardId"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  try {
    await updateBoard(parsed.data.boardId, {
      name: parsed.data.name,
      description: parsed.data.description,
    });
    return { success: "Board berhasil diperbarui" };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Gagal memperbarui board",
    };
  }
}

const deleteBoardSchema = z.object({
  boardId: z.string().min(1),
});

export async function deleteBoardAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = deleteBoardSchema.safeParse({
    boardId: formData.get("boardId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  try {
    await deleteBoard(parsed.data.boardId);
    return { success: "Board berhasil dihapus" };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Gagal menghapus board",
    };
  }
}

