"use server";

import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import type {
  BoardRow,
  BoardWithColumns,
  CardRow,
  ColumnRow,
  ProfileRow,
} from "@/lib/database.types";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";

const boardPath = (boardId: string) => `/boards/${boardId}`;

function assertAuthenticated(userId: string | null | undefined): asserts userId {
  if (!userId) {
    throw new Error("User must be authenticated to access this resource.");
  }
}

async function ensureProfile(): Promise<ProfileRow> {
  const { userId } = await auth();
  assertAuthenticated(userId);

  const [supabase, clerkUser] = await Promise.all([
    createSupabaseServerClient(),
    currentUser(),
  ]);
  const adminSupabase = createSupabaseAdminClient();

  if (!clerkUser) {
    throw new Error("Unable to load Clerk user profile.");
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses?.[0]?.emailAddress ??
    null;

  if (!email) {
    throw new Error("User does not have a primary email address.");
  }

  const fullName = clerkUser.fullName ?? null;

  let supabaseUserId: string | null = null;

  try {
    const { data: authData } = await supabase.auth.getUser();
    supabaseUserId = authData?.user?.id ?? null;
  } catch {
    // Supabase session missing; will fall back to admin lookup.
  }

  if (!supabaseUserId) {
    const { data: existingProfile, error: profileLookupError } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileLookupError) {
      throw new Error(`Failed to lookup existing profile: ${profileLookupError.message}`);
    }

    supabaseUserId = existingProfile?.id ?? null;
  }

  if (!supabaseUserId) {
    supabaseUserId = await findAuthUserIdByEmail(adminSupabase, email);
  }

  if (!supabaseUserId) {
    const { data: createdUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        clerk_id: userId,
        full_name: fullName ?? undefined,
      },
    });

    if (createUserError || !createdUser?.user?.id) {
      throw new Error(`Unable to provision Supabase user: ${createUserError?.message ?? "unknown"}`);
    }

    supabaseUserId = createdUser.user.id;
  }

  const { data, error: upsertError } = await adminSupabase
    .from("profiles")
    .upsert(
      {
        id: supabaseUserId,
        email,
        full_name: fullName,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (upsertError || !data) {
    throw new Error(`Failed to sync profile: ${upsertError?.message ?? "unknown"}`);
  }

  return data as ProfileRow;
}

async function findAuthUserIdByEmail(
  adminSupabase: ReturnType<typeof createSupabaseAdminClient>,
  email: string,
): Promise<string | null> {
  const normalizedEmail = email.toLowerCase();
  const pageSize = 100;
  let page = 1;

  for (let attempts = 0; attempts < 10; attempts += 1) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({ page, perPage: pageSize });

    if (error) {
      throw new Error(`Failed to enumerate Supabase auth users: ${error.message}`);
    }

    const users = data?.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === normalizedEmail);

    if (match) {
      return match.id;
    }

    if (!data?.nextPage) {
      return null;
    }

    page = data.nextPage;
  }

  return null;
}


export type DashboardSummary = {
  totalBoards: number;
  totalColumns: number;
  totalCards: number;
  latestBoard: {
    id: string;
    name: string;
    createdAt: string;
    // updatedAt: string;
  } | null;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const profile = await ensureProfile();
  const supabase = await createSupabaseServerClient();

  const { data: boardsData, error: boardsError } = await supabase
    .from("boards")
    .select("id, name, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (boardsError) {
    throw new Error(`Failed to load board summary: ${boardsError.message}`);
  }

  const boards = (boardsData ?? []) as Array<Pick<BoardRow, "id" | "name" | "created_at">>;
  const totalBoards = boards.length;
  const boardIds = boards.map((board) => board.id);

  let totalColumns = 0;
  let totalCards = 0;

  if (boardIds.length > 0) {
    const { data: columnsData, error: columnsError } = await supabase
      .from("columns")
      .select("id")
      .in("board_id", boardIds);

    if (columnsError) {
      throw new Error(`Failed to load column summary: ${columnsError.message}`);
    }

    const columnIds = (columnsData ?? []).map((column) => column.id as string);
    totalColumns = columnIds.length;

    if (columnIds.length > 0) {
      const { count: cardsCount, error: cardsError } = await supabase
        .from("cards")
        .select("id", { count: "exact", head: true })
        .in("column_id", columnIds);

      if (cardsError) {
        throw new Error(`Failed to load card summary: ${cardsError.message}`);
      }

      totalCards = cardsCount ?? 0;
    }
  }

  const latestBoard = boards[0]
    ? {
        id: boards[0].id,
        name: boards[0].name,
        createdAt: boards[0].created_at,
        // updatedAt: boards[0].updated_at,
      }
    : null;

  return {
    totalBoards,
    totalColumns,
    totalCards,
    latestBoard,
  };
}

export async function listBoards(): Promise<BoardRow[]> {
  const profile = await ensureProfile();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load boards: ${error.message}`);
  }

  return (data ?? []) as BoardRow[];
}

export async function getBoardWithRelations(boardId: string): Promise<BoardWithColumns | null> {
  await ensureProfile();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("boards")
    .select(
      `id, created_at, name, description, user_id,
       columns:columns (
         id, created_at, name, position, board_id,
         cards:cards (
           id, created_at, title, content, position, column_id
         )
       )`
    )
    .eq("id", boardId)
    .order("position", { ascending: true, foreignTable: "columns" })
    .order("position", { ascending: true, foreignTable: "columns.cards" })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load board: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const board = data as BoardWithColumns;
  const sortedColumns = (board.columns ?? []).sort((a, b) => a.position - b.position);

  return {
    ...board,
    columns: sortedColumns.map((column) => ({
      ...column,
      cards: (column.cards ?? []).sort((a, b) => a.position - b.position) as CardRow[],
    })),
  } as BoardWithColumns;
}

export async function createBoard(payload: {
  name: string;
  description?: string | null;
}): Promise<BoardRow> {
  const profile = await ensureProfile();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("boards")
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      user_id: profile.id,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create board: ${error?.message ?? "unknown"}`);
  }

  revalidatePath("/dashboard");
  return data as BoardRow;
}

export async function updateBoard(boardId: string, payload: {
  name?: string;
  description?: string | null;
}): Promise<BoardRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("boards")
    .update(payload)
    .eq("id", boardId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update board: ${error?.message ?? "unknown"}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(boardPath(boardId));
  return data as BoardRow;
}

export async function deleteBoard(boardId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("boards").delete().eq("id", boardId);

  if (error) {
    throw new Error(`Failed to delete board: ${error.message}`);
  }

  revalidatePath("/dashboard");
}

export async function createColumn(boardId: string, payload: {
  name: string;
  position?: number;
}): Promise<ColumnRow> {
  const supabase = await createSupabaseServerClient();

  const effectivePosition = payload.position ?? (await nextColumnPosition(boardId));

  const { data, error } = await supabase
    .from("columns")
    .insert({
      board_id: boardId,
      name: payload.name,
      position: effectivePosition,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create column: ${error?.message ?? "unknown"}`);
  }

  revalidatePath(boardPath(boardId));
  return data as ColumnRow;
}

async function nextColumnPosition(boardId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("columns")
    .select("position")
    .eq("board_id", boardId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to determine next column position: ${error.message}`);
  }

  return data ? (data.position ?? 0) + 1000 : 1000;
}

export async function updateColumn(boardId: string, columnId: string, payload: {
  name?: string;
  position?: number;
}): Promise<ColumnRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("columns")
    .update(payload)
    .eq("id", columnId)
    .eq("board_id", boardId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update column: ${error?.message ?? "unknown"}`);
  }

  revalidatePath(boardPath(boardId));
  return data as ColumnRow;
}

export async function deleteColumn(boardId: string, columnId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("columns")
    .delete()
    .eq("id", columnId)
    .eq("board_id", boardId);

  if (error) {
    throw new Error(`Failed to delete column: ${error.message}`);
  }

  revalidatePath(boardPath(boardId));
}

export async function reorderColumns(boardId: string, orderedColumnIds: string[]): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const updates = orderedColumnIds.map((id, index) => ({
    id,
    board_id: boardId,
    position: (index + 1) * 1000,
  }));

  const { error } = await supabase
    .from("columns")
    .upsert(updates, { onConflict: "id" });

  if (error) {
    throw new Error(`Failed to reorder columns: ${error.message}`);
  }

  revalidatePath(boardPath(boardId));
}

export async function createCard(boardId: string, columnId: string, payload: {
  title: string;
  content?: string | null;
}): Promise<CardRow> {
  const supabase = await createSupabaseServerClient();

  const effectivePosition = await nextCardPosition(columnId);

  const { data, error } = await supabase
    .from("cards")
    .insert({
      column_id: columnId,
      title: payload.title,
      content: payload.content ?? null,
      position: effectivePosition,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create card: ${error?.message ?? "unknown"}`);
  }

  revalidatePath(boardPath(boardId));
  return data as CardRow;
}

async function nextCardPosition(columnId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cards")
    .select("position")
    .eq("column_id", columnId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to determine next card position: ${error.message}`);
  }

  return data ? (data.position ?? 0) + 1000 : 1000;
}

export async function updateCard(boardId: string, cardId: string, payload: {
  title?: string;
  content?: string | null;
  position?: number;
  column_id?: string;
}): Promise<CardRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("cards")
    .update(payload)
    .eq("id", cardId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update card: ${error?.message ?? "unknown"}`);
  }

  revalidatePath(boardPath(boardId));
  return data as CardRow;
}

export async function deleteCard(boardId: string, cardId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId);

  if (error) {
    throw new Error(`Failed to delete card: ${error.message}`);
  }

  revalidatePath(boardPath(boardId));
}

export async function reorderCards(boardId: string, columnId: string, orderedCardIds: string[]): Promise<void> {
  const supabase = await createSupabaseServerClient();

  if (orderedCardIds.length === 0) {
    revalidatePath(boardPath(boardId));
    return;
  }

  const { data: existingCards, error: fetchError } = await supabase
    .from("cards")
    .select("id, title, content")
    .in("id", orderedCardIds);

  if (fetchError) {
    throw new Error(`Failed to load cards for reorder: ${fetchError.message}`);
  }

  const cardById = new Map((existingCards ?? []).map((card) => [card.id, card] as const));

  const updates = orderedCardIds.map((id, index) => {
    const match = cardById.get(id);
    if (!match) {
      throw new Error(`Cannot reorder unknown card ${id}`);
    }

    return {
      id,
      column_id: columnId,
      position: (index + 1) * 1000,
      title: match.title,
      content: match.content ?? null,
    };
  });

  const { error } = await supabase
    .from("cards")
    .upsert(updates, { onConflict: "id" });

  if (error) {
    throw new Error(`Failed to reorder cards: ${error.message}`);
  }

  revalidatePath(boardPath(boardId));
}

export async function moveCard(params: {
  boardId: string;
  cardId: string;
  targetColumnId: string;
  targetOrder: string[];
}): Promise<void> {
  const { boardId, cardId, targetColumnId, targetOrder } = params;
  const supabase = await createSupabaseServerClient();

  const normalizedOrder = Array.from(new Set(targetOrder));
  if (!normalizedOrder.includes(cardId)) {
    normalizedOrder.push(cardId);
  }

  const { data: existingCards, error: fetchError } = await supabase
    .from("cards")
    .select("id, title, content")
    .in("id", normalizedOrder);

  if (fetchError) {
    throw new Error(`Failed to load cards for move: ${fetchError.message}`);
  }

  const cardById = new Map((existingCards ?? []).map((card) => [card.id, card] as const));

  const updates = normalizedOrder.map((id, index) => {
    const match = cardById.get(id);
    if (!match) {
      throw new Error(`Cannot move unknown card ${id}`);
    }

    return {
      id,
      column_id: targetColumnId,
      position: (index + 1) * 1000,
      title: match.title,
      content: match.content ?? null,
    };
  });

  const { error } = await supabase
    .from("cards")
    .upsert(updates, { onConflict: "id" });

  if (error) {
    throw new Error(`Failed to move card: ${error.message}`);
  }

  revalidatePath(boardPath(boardId));
}












