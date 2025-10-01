export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type BoardRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  user_id: string;
};

export type ColumnRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  position: number;
  board_id: string;
};

export type CardRow = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  content: string | null;
  position: number;
  column_id: string;
};

export type ColumnWithCards = ColumnRow & {
  cards: CardRow[];
};

export type BoardWithColumns = BoardRow & {
  columns: ColumnWithCards[];
};

