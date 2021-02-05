import { BoardColumn } from "../../@types";

export enum AppMode {
  "vote",
  "review",
};

export type State = {
  mode: AppMode;
  columns: BoardColumn[];
  cardBeingDragged: any;
};

export const state: State = {
  mode: AppMode.vote,
  columns: [
    {
      id: "3",
      isEditing: false,
      name: "Loading...",
    },
    {
      id: "2",
      isEditing: false,
      name: "Loading...",
    },
    {
      id: "1",
      isEditing: false,
      name: "Loading...",
    }
    ],
  cardBeingDragged: null,
};
