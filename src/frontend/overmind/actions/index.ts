import { AppMode } from "../state";
import { Action, mutate } from "overmind";
import { BoardColumn, Card } from "../../../@types";

export const updateMode: Action<AppMode> = ({ state }, mode: AppMode) => {
  state.mode = mode;
};

export const updateCardBeingDragged: Action<any> = ({ state }, cardData: any) => {
  state.cardBeingDragged = cardData;
}

export const addCard = mutate(function addCard({ state }, card: Card) {
  state.cards = {
    ...state.cards,
    [card.id]: card
  }

  const columnIndex = state.columns.findIndex((column) => {
    return column.id === card.columnId;
  });
  let columnsCopy = state.columns;
  columnsCopy[columnIndex].cardIds.push(card.id);
  state.columns = [
    ...columnsCopy,
  ];
});

export const removeCard = mutate(function deleteCard({ state }, cardId: string) {
  const card = state.cards[cardId];
  let cardsCopy = state.cards;
  delete cardsCopy[cardId];
  state.cards = {
    ...cardsCopy,
  };

  const columnIndex = state.columns.findIndex((column) => {
    return column.id === card.columnId;
  });
  let columnsCopy = state.columns;
  const cardIdIndex = columnsCopy[columnIndex].cardIds.indexOf(card.id);
  columnsCopy[columnIndex].cardIds.splice(cardIdIndex, 1);
  state.columns = [
    ...columnsCopy,
  ];
});

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

export const setBoardState: Action<{
  cards: { [id: string]: Card },
  columns: BoardColumn[],
}> = ({ state }, boardState: {
  cards: { [id: string]: Card },
  columns: BoardColumn[],
}) => {
  state.columns = boardState.columns;
  state.cards = boardState.cards;
};
