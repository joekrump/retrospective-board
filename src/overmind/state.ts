export enum AppMode {
  "vote",
  "review",
};

export type State = {
  mode: AppMode;
  columns: BoardColumn[];
};

export const state: State = {
  mode: AppMode.vote,
  columns: [],
};
