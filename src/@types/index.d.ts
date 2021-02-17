export interface Card {
  id: string;
  text: string;
  stars: {
    [sessionId: string]: number;
  };
  columnId: string;
  starsCount: number;
  ownerId: string;
  isEditing: boolean;
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
  currentStep: number;
  totalSteps: number;
  stepsIntervalId?: ReturnType<typeof setInterval>;
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
