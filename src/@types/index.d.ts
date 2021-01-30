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
  cards: Card[];
}

export interface Board {
  title: string;
  showResults: boolean;
  columns: Column[];
}

export interface BoardColumn {
  id: string;
  name: string;
  isEditing: boolean;
  new?: boolean;
}

export interface Session {
  id: string;
  remainingStars: number;
}
