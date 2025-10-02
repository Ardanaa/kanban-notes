export type GuestCard = {
  id: string;
  title: string;
  content: string | null;
};

export type GuestColumn = {
  id: string;
  name: string;
  cards: GuestCard[];
};

export type GuestBoard = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  columns: GuestColumn[];
};

export type GuestBoardsState = {
  boards: GuestBoard[];
  activeBoardId: string;
};



