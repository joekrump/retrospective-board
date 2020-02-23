import { State, AppMode } from "../state";

export function updateMode({ state }: { state: State }, mode: AppMode) {
  state.mode = mode;
};
