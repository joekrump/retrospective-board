import React, { useEffect, useMemo } from "react";
import { Column } from "../Column/Column";
import * as uuid from "uuid";
import { BoardControls } from "../BoardControls/BoardControls";
import { useOvermind } from "../../overmind";

import "./board.css";
import { AppMode } from "../../overmind/state";
import { Board as IBoard, BoardColumn, Card } from "../../../@types";

interface BoardProps {
  socket: SocketIOClient.Socket;
  boardId: string;
}

export enum SortDirection {
  "none",
  "asc",
  "desc",
};

const Board = (props: BoardProps) => {
  const { state: { cards, columns, mode, sessionId }, actions } = useOvermind();
  const [sortDirection, updateSortDirection] = React.useState(SortDirection.desc);

  useEffect(function onMount() {
    props.socket.on(`board:updated:${props.boardId}`, (data: any) => {
      actions.updateBoardTitle(data.title);
    });

    props.socket.on(`column:created:${props.boardId}`, (data: any) => {
      addColumn(data);
    });

    props.socket.on(`column:deleted:${props.boardId}`, (data: any) => {
      deleteColumn(null, data.id, true);
    });

    props.socket.on(`card:moved:${props.boardId}`, handleCardMoved);
    props.socket.on(`card:created:${props.boardId}`, ({ card }: { card: Card }) => {
      actions.addCard(card);
    });

    props.socket.on(`card:deleted:${props.boardId}`, ({ cardId }: { cardId: string }) => {
      actions.removeCard(cardId);
    });

    return function cleanup() {
      props.socket.removeListener(`column:deleted:${props.boardId}`);
      props.socket.removeListener(`column:created:${props.boardId}`);
      props.socket.removeListener(`card:moved:${props.boardId}`);
      props.socket.removeListener(`card:created:${props.boardId}`);
      props.socket.removeListener(`card:deleted:${props.boardId}`);
    };
  }, [columns]);

  const sortColumnCardsByStars = () => {
    let newSortDirection = SortDirection.none;

    switch(sortDirection as SortDirection) {
      case SortDirection.asc:
        newSortDirection = SortDirection.desc;
        break;
      case SortDirection.desc:
        newSortDirection = SortDirection.asc;
        break;
      default:
        break;
    }
    updateSortDirection(newSortDirection);
  }

  function addColumn(column?: any) {
    let boardColumn: BoardColumn;

    if (column) {
      boardColumn = { id: column.id, name: column.name, isEditing: false, cardIds: [] };
      props.socket.emit("column:loaded", {
        boardId: props.boardId,
        id: column.id,
        sessionId,
      });
    } else {
      boardColumn = { id: uuid.v4(), name: "New Column", isEditing: true, new: true, cardIds: [] };
    }

    actions.addColumn(boardColumn);
  }

  function handleCardMoved({
    cardId,
    toColumnId,
  }: {
    cardId: string,
    toColumnId: string
  }) {
    const cardCopy = {
      ...cards[cardId],
      columnId: toColumnId,
    };
    actions.removeCard(cardId);
    actions.addCard(cardCopy);
  }

  function renderColumns() {
    let markup: JSX.Element[] = [];
    const oneHundredPercent = 100;
    const columnCount = columns.length;
    const maxWidthPercentage = oneHundredPercent / columnCount;

    for (let i = 0; i < columnCount; i++) {
      let name = columns[i].name;
      markup.push(
        <Column
          key={columns[i].id}
          id={columns[i].id}
          name={name}
          deleteColumn={(event) => deleteColumn(event, columns[i].id)}
          socket={props.socket}
          boardId={props.boardId}
          maxWidthPercentage={maxWidthPercentage}
          isEditing={columns[i].isEditing}
          new={columns[i].new}
          sortDirection={sortDirection}
        />
      );
    }

    if (mode !== AppMode.review) {
      markup.push(
        <div className="column" key="add-new-column">
          <div className="add-column--button-filler">

          </div>
          <button
            title="Add Column"
            className="button button--add-column"
            onClick={() => addColumn()}
          >
            +
          </button>
        </div>
      );
    }

    return markup;
  }

  function deleteColumn(event: React.MouseEvent | null, id: string, fromSocket: boolean = false) {
    if (event) {
      event.preventDefault();
    }

    for (let i = 0; i < columns.length; i++) {
      if (columns[i].id === id) {
        actions.deleteColumn(columns[i]);
        break;
      }
    }

    if (!fromSocket) {
      props.socket.emit(`column:deleted`, {
        boardId: props.boardId,
        id,
        sessionId,
      });
    }
  }

  const memoizedColumns = useMemo(() => {
    return renderColumns();
  }, [columns, mode, sortDirection]);

  return (
    <main id="board">
      <BoardControls
        sortColumnCardsByStars={sortColumnCardsByStars}
        socket={props.socket}
        boardId={props.boardId}
        sortDirection={sortDirection}
      />
      <div id="columns">
        { memoizedColumns }
      </div>
    </main>
  );
}

export default Board;
