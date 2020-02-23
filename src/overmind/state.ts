export enum AppMode {
  "vote",
  "review",
};

export type State = {
  mode: AppMode;
};

export const state: State = {
  mode: AppMode.vote,
};
