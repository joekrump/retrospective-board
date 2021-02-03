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
  columns: [],
  cardBeingDragged: null,
};
