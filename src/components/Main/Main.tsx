import React, { useEffect } from "react";
import { Column } from "../Column/Column";
import uuid = require("uuid");
import { BoardControls } from "../BoardControls/BoardControls";

import "./main.css";

interface MainProps {
  socket: SocketIOClient.Socket;
  boardId: string;
}

export enum SortDirection {
  "none",
  "asc",
  "desc",
};

export const Main = (props: MainProps) => {
  const [columns, updateColumns] = React.useState([] as BoardColumn[]);
  const [boardTitle, updateBoardTitle] = React.useState("" as string);
  const [sortDirection, updateSortDirection] = React.useState(SortDirection.none);
  const [remainingStars, updateRemainingStars] = React.useState();

  useEffect(function onMount() {
    props.socket.on(`board:loaded:${props.boardId}`, (
      data: { board: Board, sessionId: string, remainingStars: number, showResults: boolean },
    ) => {
      updateBoardTitle(data.board.title);
      updateRemainingStars(data.remainingStars);
      sessionStorage.setItem("retroSessionId", data.sessionId);
      data.board.columns.forEach((column: {id: string}) => {
        addColumn(column);
      });
    });

    props.socket.on(`board:updated:${props.boardId}`, (data: any) => {
      updateBoardTitle(data.title);
    });

    props.socket.on(`board:update-remaining-stars:${props.boardId}`, (data: any) => {
      updateRemainingStars(data.remainingStars);
    })

    props.socket.on(`column:created:${props.boardId}`, (data: any) => {
      addColumn(data);
    });

    props.socket.on(`column:deleted:${props.boardId}`, (data: any) => {
      deleteColumn(null, data.id, true);
    });

    return function cleanup() {
      props.socket.removeListener(`board:loaded:${props.boardId}`);
      props.socket.removeListener(`board:update-remaining-stars:${props.boardId}`);
      props.socket.removeListener(`column:deleted:${props.boardId}`);
      props.socket.removeListener(`column:created:${props.boardId}`);
    };
  }, []);

  const sortColumnCardsByStars = () => {
    let newSortDirection = SortDirection.none;

    switch(sortDirection as SortDirection) {
      case SortDirection.none:
        newSortDirection = SortDirection.desc;
        break;
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
    let newColumns: any[] = columns.slice(0);
    if (column) {
      newColumns.push({ id: column.id, name: column.name, isEditing: false });
      props.socket.emit("column:loaded", {
        boardId: props.boardId,
        id: column.id,
        sessionId: sessionStorage.getItem("retroSessionId"),
      });
    } else {
      const newColumn = { id: uuid.v4(), name: "New Column", isEditing: true, new: true };

      newColumns.push(newColumn);
    }

    updateColumns(newColumns);
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
        >
        </Column>
      );
    }

    return markup;
  }

  function deleteColumn(event: React.MouseEvent | null, id: string, fromSocket: boolean = false) {
    if (event) {
      event.preventDefault();
    }

    let newColumns = columns.filter((column: BoardColumn) => {
      return column.id !== id;
    });

    if (!fromSocket) {
      props.socket.emit(`column:deleted`, {
        boardId: props.boardId,
        id,
        sessionId: sessionStorage.getItem("retroSessionId"),
      });
    }

    updateColumns(newColumns);
  }

  return (
    <main>
      <BoardControls
        sortColumnCardsByStars={sortColumnCardsByStars}
        addColumn={() => addColumn()}
        title={boardTitle}
        socket={props.socket}
        boardId={props.boardId}
        remainingStars={remainingStars}
        sortDirection={sortDirection}
      />
      <div id="columns">
        {renderColumns()}
      </div>
    </main>
  );
}
