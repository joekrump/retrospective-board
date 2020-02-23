import { AppMode } from "../state";
import { Action } from "overmind";

export const updateMode: Action<AppMode> = ({ state }, mode: AppMode) => {
  state.mode = mode;
};
