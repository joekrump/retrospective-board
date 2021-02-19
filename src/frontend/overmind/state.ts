import { BoardColumn, Card } from "../../@types";

export enum AppMode {
  "vote",
  "review",
};

export type State = {
  mode: AppMode;
  board: {
    title: string;
  };
  sessionId: string;
  columns: BoardColumn[];
  cards: { [ id: string ]: Card }
  cardBeingDragged: any;
  timer: {
    remainingMS: number;
    status: "running" | "paused" | "stopped";
  },
  remainingStars: number;
};

const initialSessionId = sessionStorage.getItem("retroSessionId") ?? "";

export const state: State = {
  mode: AppMode.vote,
  sessionId: initialSessionId,
  remainingStars: 0,
  board: {
    title: "",
  },
  timer: {
    remainingMS: 0,
    status: "stopped",
  },
  columns: [
    {
      id: "3",
      isEditing: false,
      name: "Loading...",
      cardIds: []
    },
    {
      id: "2",
      isEditing: false,
      name: "Loading...",
      cardIds: []
    },
    {
      id: "1",
      isEditing: false,
      name: "Loading...",
      cardIds: []
    }
  ],
  cards: {},
  cardBeingDragged: null,
};
