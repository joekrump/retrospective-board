export interface CardData {
  id: string;
  columnId?: string;
  editable: boolean;
  text?: string;
  ownerId: string;
  starsCount: number;
  userStars: number;
  isEditing: boolean;
  newCard?: boolean;
}

export interface Card {
  id: string;
  text: string;
  stars: {
    [sessionId: string]: number;
  };
  starsCount: number;
  ownerId: string;
}

export interface Column {
  name: string;
  id: string;
  cardIds: string[];
}

export interface Board {
  title: string;
  showResults: boolean;
  columns: Column[];
  cards: { [id: string]: Card };
}

export interface BoardColumn {
  id: string;
  name: string;
  isEditing: boolean;
  cardIds: string[],
  new?: boolean;
}

export interface Session {
  id: string;
  remainingStars: number;
}
