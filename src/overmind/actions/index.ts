import { AppMode } from "../state";
import { Action, mutate } from "overmind";

export const updateMode: Action<AppMode> = ({ state }, mode: AppMode) => {
  state.mode = mode;
};

export const addColumn = mutate(function setColumns({ state }, column: BoardColumn) {
  state.columns = [
    ...state.columns,
    column,
  ];
});

export const deleteColumn = mutate(function setColumns({ state }, column: BoardColumn) {
  const copy = [
    ...state.columns
  ];
  const index = copy.indexOf(column);
  if (index !== -1) {
    copy.splice(index, 1);
    state.columns = copy;
  }
});

export const setColumns: Action<BoardColumn[]> = ({ state }, columns: BoardColumn[]) => {
  state.columns = columns;
};
